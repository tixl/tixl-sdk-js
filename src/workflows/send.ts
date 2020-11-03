import JSBI from 'jsbi';
import { Blockchain, Crypto, KeySet, Block, AssetSymbol, Transaction, SigPublicKey } from '@tixl/tixl-types';

import { createSendBlock } from './api/send';
import { searchFunds } from './api/funds';
import { workingCopy } from './utils';

export type SendTx = {
  blockchain: Blockchain;
  tx: Transaction;
  sendBlock: Block;
};

export async function sendTx(
  crypto: Crypto,
  keySet: KeySet,
  blockchain: Blockchain,
  prev: Block,
  amount: string | number | bigint,
  address: SigPublicKey,
  symbol: AssetSymbol,
  payload?: string,
): Promise<SendTx> {
  const blockchainCopy = workingCopy(blockchain);

  if (!prev) throw 'no prev for chain found';

  const prevCopy = workingCopy(prev);
  const newBalance = JSBI.subtract(JSBI.BigInt(prevCopy.senderBalance), JSBI.BigInt(amount.toString()));

  const send2wallet = await createSendBlock(
    crypto,
    prevCopy,
    blockchainCopy.publicSig,
    amount,
    newBalance.toString(),
    address,
    symbol,
    keySet.sig.privateKey,
    payload,
  );

  blockchainCopy.addBlock(send2wallet.block);

  return {
    blockchain: blockchainCopy,
    tx: send2wallet.tx,
    sendBlock: send2wallet.block,
  };
}

export async function send(
  crypto: Crypto,
  keySet: KeySet,
  accountChain: Blockchain,
  amount: string | number | bigint,
  address: SigPublicKey,
  symbol: AssetSymbol,
  payload?: string,
): Promise<SendTx | false> {
  const assetBranch = await searchFunds(accountChain, amount, symbol);

  if (!assetBranch) return false;

  return sendTx(crypto, keySet, accountChain, assetBranch.prev, assetBranch.amount, address, symbol, payload);
}
