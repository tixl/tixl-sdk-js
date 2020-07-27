import JSBI from 'jsbi';
import {
  Blockchain,
  Crypto,
  KeySet,
  Block,
  AssetSymbol,
  BlockchainTx,
  NTRUPublicKey,
  Transaction,
} from '@tixl/tixl-types';

import { createSendBlock } from './api/send';
import { decryptSender } from './api/encryption';
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
  amount: string | number | bigint,
  address: NTRUPublicKey,
  symbol: AssetSymbol,
): Promise<SendTx> {
  const blockchainCopy = workingCopy(blockchain);
  const prev = workingCopy(blockchainCopy.leaf());

  if (!prev) throw 'no prev for chain found';

  await decryptSender(crypto, prev, keySet.aes);

  const newBalance = JSBI.subtract(JSBI.BigInt(prev.senderBalance), JSBI.BigInt(amount.toString()));

  const send2wallet = await createSendBlock(
    crypto,
    prev,
    blockchainCopy.publicSig,
    amount,
    newBalance.toString(),
    symbol,
    keySet.sig.privateKey,
    address,
    keySet.aes,
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
  address: NTRUPublicKey,
  symbol: AssetSymbol,
  loader: Record<string, Blockchain | undefined>,
): Promise<BlockchainTx[] | false> {
  // gather list of stealthchains with sufficient amounts
  const stealthchains = await searchFunds(crypto, accountChain, keySet, amount, symbol, loader);

  if (!stealthchains) return false;

  // create send blocks on all these stealthchains
  return Promise.all(
    stealthchains.map(async (fund) => {
      return sendTx(crypto, fund.keySet, fund.stealthChain, fund.amount, address, symbol);
    }),
  );
}
