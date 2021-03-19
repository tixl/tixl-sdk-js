import JSBI from 'jsbi';
import { Block, Blockchain, Crypto, KeySet, AssetSymbol, Transaction } from '@tixl/tixl-types';

import { createReceiveBlock } from './api/receive';
import { workingCopy } from './utils';
import { assetTx } from './api/asset';

export type ReceiveChanges = {
  accountchainAsset:
    | {
        tx: Transaction;
        blockchain: Blockchain;
      }
    | undefined;
  assetReceive: {
    tx: Transaction;
    blockchain: Blockchain;
  };
};

export type ReceiveTx = {
  blockchain: Blockchain;
  tx: Transaction;
  receiveBlock: Block;
};

export async function receiveTx(
  crypto: Crypto,
  keySet: KeySet,
  blockchain: Blockchain,
  prev: Block,
  send: Block,
  symbol: AssetSymbol,
): Promise<ReceiveTx> {
  const blockchainCopy = workingCopy(blockchain);

  const newBalance = JSBI.add(JSBI.BigInt(prev.senderBalance), JSBI.BigInt(send.senderAmount));
  console.log('receive balance', newBalance);

  const receive2wallet = await createReceiveBlock(
    crypto,
    prev,
    send,
    blockchainCopy.publicSig,
    send.senderAmount,
    newBalance.toString(),
    symbol,
    keySet.sig.privateKey,
  );

  blockchainCopy.addBlock(receive2wallet.block);

  return {
    blockchain: blockchainCopy,
    tx: receive2wallet.tx,
    receiveBlock: receive2wallet.block,
  };
}

/**
 * Create several transactions to receive a send block onto a stealthchain.
 *
 * @param stealthId use send block signature
 */
export async function receive(
  crypto: Crypto,
  acKeySet: KeySet,
  accountchain: Blockchain,
  send: Block,
  symbol: AssetSymbol,
): Promise<ReceiveChanges> {
  const accountChainCopy = workingCopy(accountchain);
  const leaf = accountChainCopy.leafAsset(symbol);

  let create;
  let receive;

  if (!leaf) {
    create = await assetTx(crypto, acKeySet, accountChainCopy, symbol);

    const assetLeaf = create.blockchain.leafAsset(symbol);

    if (!assetLeaf) throw 'cannot add asset block';

    receive = await receiveTx(crypto, acKeySet, create.blockchain, assetLeaf, send, symbol);
  } else {
    receive = await receiveTx(crypto, acKeySet, accountChainCopy, leaf, send, symbol);
  }

  return {
    accountchainAsset: create && {
      tx: create.tx,
      blockchain: create.blockchain,
    },
    assetReceive: {
      tx: receive.tx,
      blockchain: receive.blockchain,
    },
  };
}
