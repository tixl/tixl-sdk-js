import JSBI from 'jsbi';
import { Blockchain, Crypto, KeySet, AssetSymbol, Transaction, Block } from '@tixl/tixl-types';

import { createDepositBlock } from './api/deposit';
import { workingCopy } from './utils';
import { assetTx } from './api/asset';
import { doesNotMatch } from 'assert';

export type DepositChanges = {
  accountchainAsset:
    | {
        tx: Transaction;
        blockchain: Blockchain;
      }
    | undefined;
  assetDeposit: {
    tx: Transaction;
    blockchain: Blockchain;
  };
};

export async function depositTx(
  crypto: Crypto,
  keySet: KeySet,
  blockchain: Blockchain,
  prev: Block,
  amount: string | number | bigint,
  extAddress: string,
  symbol: AssetSymbol,
  claimSignature?: string,
) {
  const blockchainCopy = workingCopy(blockchain);

  if (!prev) throw 'no leaf for chain found';

  const newBalance = JSBI.add(JSBI.BigInt(prev.senderBalance), JSBI.BigInt(amount.toString()));
  console.log('deposit new balance', newBalance);

  const deposit2wallet = await createDepositBlock(
    crypto,
    prev,
    blockchainCopy.publicSig,
    extAddress,
    amount,
    newBalance.toString(),
    symbol,
    claimSignature,
    keySet.sig.privateKey,
  );

  blockchainCopy.addBlock(deposit2wallet.block);

  return {
    blockchain: blockchainCopy,
    tx: deposit2wallet.tx,
    receiveBlock: deposit2wallet.block,
  };
}

/**
 * Create several transactions to receive a send block onto a stealthchain.
 *
 * @param stealthId use send block signature
 */
export async function deposit(
  crypto: Crypto,
  acKeySet: KeySet,
  accountchain: Blockchain,
  amount: string | number | bigint,
  extAddress: string,
  symbol: AssetSymbol,
  claimSignature?: string,
): Promise<DepositChanges> {
  const accountChainCopy = workingCopy(accountchain);
  const leaf = accountChainCopy.leafAsset(symbol);

  let create;
  let deposit;

  if (!leaf) {
    create = await assetTx(crypto, acKeySet, accountChainCopy, symbol);

    const assetLeaf = create.blockchain.leafAsset(symbol);

    if (!assetLeaf) throw 'cannot add asset block';

    deposit = await depositTx(
      crypto,
      acKeySet,
      create.blockchain,
      assetLeaf,
      amount,
      extAddress,
      symbol,
      claimSignature,
    );
  } else {
    deposit = await depositTx(crypto, acKeySet, accountChainCopy, leaf, amount, extAddress, symbol, claimSignature);
  }

  return {
    accountchainAsset: create && {
      tx: create.tx,
      blockchain: create.blockchain,
    },
    assetDeposit: {
      tx: deposit.tx,
      blockchain: deposit.blockchain,
    },
  };
}
