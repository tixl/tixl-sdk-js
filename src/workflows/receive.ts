import JSBI from 'jsbi';
import { Block, Blockchain, Crypto, KeySet, AssetSymbol, Transaction } from '@tixl/tixl-types';

import { createReceiveBlock } from './api/receive';
import { decryptSender } from './api/encryption';
import { findStealthchainKeySet, appendStealthChain } from './stealthchain';
import { workingCopy, BlockchainIndex } from './utils';

export type ReceiveTx = {
  blockchain: Blockchain;
  tx: Transaction;
  receiveBlock: Block;
};

export type ReceiveChanges = {
  accountchainOpen:
    | {
        tx: Transaction;
        blockchain: Blockchain;
      }
    | undefined;
  stealthchainOpen:
    | {
        tx: Transaction;
        blockchain: Blockchain;
      }
    | undefined;
  stealthchainReceive: {
    tx: Transaction;
    blockchain: Blockchain;
  };
};

export async function receiveTx(
  crypto: Crypto,
  keySet: KeySet,
  blockchain: Blockchain,
  send: Block,
  symbol: AssetSymbol,
): Promise<ReceiveTx> {
  const blockchainCopy = workingCopy(blockchain);
  const prev = workingCopy(blockchainCopy.leaf());

  if (!prev) throw 'no leaf for chain found';

  await decryptSender(crypto, prev, keySet.aes);

  const newBalance = JSBI.add(JSBI.BigInt(prev.senderBalance), JSBI.BigInt(send.receiverAmount));
  console.log('receive balance', newBalance);

  const receive2wallet = await createReceiveBlock(
    crypto,
    prev,
    send,
    blockchainCopy.publicSig,
    send.receiverAmount,
    newBalance.toString(),
    symbol,
    keySet.sig.privateKey,
    keySet.aes,
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
  stealthId: string,
  loader: BlockchainIndex,
  symbol: AssetSymbol,
): Promise<ReceiveChanges> {
  // load stealth chain
  let stealthchain: Blockchain | undefined;
  let scKeySet = await findStealthchainKeySet(crypto, accountchain, acKeySet, stealthId);

  // if not exist => append stealthchain (id = stealthId)
  let create;

  if (!scKeySet) {
    create = await appendStealthChain(crypto, accountchain, acKeySet, stealthId, symbol);
    stealthchain = create.stealthchain.blockchain;
    scKeySet = create.scKeySet;
  } else {
    stealthchain = loader[scKeySet.sig.publicKey as string];
  }

  if (!stealthchain) throw 'could not load or create stealthchain';

  // receiveTx on stealthchain
  const receive = await receiveTx(crypto, scKeySet, stealthchain, send, symbol);

  // return all writable TX
  return {
    accountchainOpen: create && create.accountchain,
    stealthchainOpen: create && create.stealthchain,
    stealthchainReceive: {
      tx: receive.tx,
      blockchain: receive.blockchain,
    },
  };
}
