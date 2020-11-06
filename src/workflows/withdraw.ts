import JSBI from 'jsbi';
import { Blockchain, Crypto, KeySet, AssetSymbol, Block, Transaction } from '@tixl/tixl-types';

import { createWithdrawalBlock } from './api/withdraw';
import { searchFunds } from './api/funds';
import { workingCopy } from './utils';

export type WithdrawTx = {
  blockchain: Blockchain;
  tx: Transaction;
  withdrawBlock: Block;
};

export async function withdrawTx(
  crypto: Crypto,
  keySet: KeySet,
  blockchain: Blockchain,
  prev: Block,
  amount: string | number | bigint,
  extAddress: string,
  symbol: AssetSymbol,
) {
  const blockchainCopy = workingCopy(blockchain);

  if (!prev) throw 'no leaf for chain found';

  const newBalance = JSBI.subtract(JSBI.BigInt(prev.senderBalance), JSBI.BigInt(amount.toString()));
  console.log('withdrawal new balance', newBalance);

  const withdrawFromwallet = await createWithdrawalBlock(
    crypto,
    prev,
    blockchainCopy.publicSig,
    extAddress,
    amount,
    newBalance.toString(),
    symbol,
    keySet.sig.privateKey,
  );

  blockchainCopy.addBlock(withdrawFromwallet.block);

  return {
    blockchain: blockchainCopy,
    tx: withdrawFromwallet.tx,
    withdrawBlock: withdrawFromwallet.block,
  };
}

export async function withdraw(
  crypto: Crypto,
  keySet: KeySet,
  accountChain: Blockchain,
  amount: string | number | bigint,
  address: string,
  symbol: AssetSymbol,
): Promise<WithdrawTx | false> {
  const assetBranch = await searchFunds(accountChain, amount, symbol);

  if (!assetBranch) return false;

  return withdrawTx(crypto, keySet, accountChain, assetBranch.prev, assetBranch.amount, address, symbol);
}
