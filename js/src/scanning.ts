import { Block, KeySet, Crypto } from '@tixl/tixl-types';

import { decryptReceiver } from './api/encryption';

export async function scanUnspentBlocks(crypto: Crypto, keySet: KeySet, unspent: Block[]) {
  const receiverKey = keySet.ntru.private;
  let found: Block | undefined = undefined;

  for (let i = 0; i < unspent.length && !found; i++) {
    const block = unspent[i];

    try {
      await decryptReceiver(crypto, block, receiverKey);

      if (block.receiverAmount != '') {
        console.log('send block amount', block.receiverAmount);
        found = block;
      }
    } catch (err) {
      // expected to get an error, when the block is not decryptable = unparseable amount
    }
  }

  return found;
}

export async function scanAllUnspentBlocks(crypto: Crypto, keySet: KeySet, unspent: Block[]) {
  const receiverKey = keySet.ntru.private;
  const found: Block[] = [];

  for (let i = 0; i < unspent.length; i++) {
    const block = unspent[i];

    try {
      await decryptReceiver(crypto, block, receiverKey);

      if (block.receiverAmount != '') {
        console.log('send block amount', block.receiverAmount);
        found.push(block);
      }
    } catch (err) {
      // expected to get an error, when the block is not decryptable = unparseable amount
    }
  }

  return found;
}
