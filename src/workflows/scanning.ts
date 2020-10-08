import { Block, KeySet, Crypto } from '@tixl/tixl-types';

export async function scanUnspentBlocks(_crypto: Crypto, keySet: KeySet, unspent: Block[]) {
  let found: Block | undefined = undefined;

  for (let i = 0; i < unspent.length && !found; i++) {
    const block = unspent[i];

    if (block.refAddress === keySet.sig.publicKey) {
      console.log('send block amount', block.senderAmount);
      found = block;
    }
  }

  return found;
}

export async function scanAllUnspentBlocks(_crypto: Crypto, keySet: KeySet, unspent: Block[]) {
  const found: Block[] = [];

  for (let i = 0; i < unspent.length; i++) {
    const block = unspent[i];

    if (block.refAddress === keySet.sig.publicKey) {
      console.log('send block amount', block.senderAmount);
      found.push(block);
    }
  }

  return found;
}
