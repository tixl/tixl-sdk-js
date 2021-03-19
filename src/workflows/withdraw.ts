import JSBI from 'jsbi';
import { Blockchain, Crypto, KeySet, AssetSymbol, Block, Transaction } from '@tixl/tixl-types';

import { createWithdrawalBlock } from './api/withdraw';
import { createBurnBlock } from './api/burn';
import { searchFunds } from './api/funds';
import { workingCopy } from './utils';

export type WithdrawChanges = {
  ethBurn:
    | {
        tx: Transaction;
        blockchain: Blockchain;
      }
    | undefined;
  assetWithdraw: {
    tx: Transaction;
    blockchain: Blockchain;
  };
};

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

export async function burnTx(
  crypto: Crypto,
  keySet: KeySet,
  blockchain: Blockchain,
  prev: Block,
  amount: string | number | bigint,
  symbol: AssetSymbol,
) {
  const blockchainCopy = workingCopy(blockchain);

  if (!prev) throw 'no leaf for chain found';

  const newBalance = JSBI.subtract(JSBI.BigInt(prev.senderBalance), JSBI.BigInt(amount.toString()));

  console.log('withdrawal new balance', newBalance);

  const burnETH = await createBurnBlock(
    crypto,
    prev,
    blockchainCopy.publicSig,
    amount,
    newBalance.toString(),
    symbol,
    keySet.sig.privateKey,
  );

  blockchainCopy.addBlock(burnETH.block);

  return {
    blockchain: blockchainCopy,
    tx: burnETH.tx,
    burnBlock: burnETH.block,
  };
}

export async function withdraw(
  crypto: Crypto,
  keySet: KeySet,
  accountChain: Blockchain,
  amount: string | number | bigint,
  address: string,
  symbol: AssetSymbol,
  burnAmount?: string | number | bigint,
): Promise<WithdrawChanges | false> {
  const assetBranch = await searchFunds(accountChain, amount, symbol);
  if (!assetBranch) return false;

  let burn;
  let withdraw;

  if (!burnAmount) {
    // normal withdraw for coins
    withdraw = await withdrawTx(crypto, keySet, accountChain, assetBranch.prev, assetBranch.amount, address, symbol);
  } else {
    // withdraw with ETH burn for erc20 tokens
    const burnBranch = await searchFunds(accountChain, burnAmount, AssetSymbol.ETH);
    if (!burnBranch) return false;

    burn = await burnTx(crypto, keySet, accountChain, burnBranch.prev, burnBranch.amount, AssetSymbol.ETH);
    withdraw = await withdrawTx(crypto, keySet, burn.blockchain, assetBranch.prev, assetBranch.amount, address, symbol);
  }

  return {
    ethBurn: burn && {
      tx: burn.tx,
      blockchain: burn.blockchain,
    },
    assetWithdraw: {
      tx: withdraw.tx,
      blockchain: withdraw.blockchain,
    },
  };
}
