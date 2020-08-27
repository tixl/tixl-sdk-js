import cloneDeep from 'lodash/cloneDeep';
import { KeySet, Blockchain, BlockType, Crypto } from '@tixl/tixl-types';

import { decryptPayload } from './api/encryption';
import { getBlockchain } from '../requests/getBlockchain';

export function workingCopy<T>(obj: T): T {
  return cloneDeep(obj);
}

export type BlockchainIndex = Record<string, Blockchain | undefined>;

export async function createLoader(crypto: Crypto, keySet: KeySet, accountChain: Blockchain): Promise<BlockchainIndex> {
  const index: BlockchainIndex = {};

  index[accountChain.publicSig as string] = accountChain;

  await Promise.all(
    accountChain.blocks.map(async (block) => {
      if (block.type !== BlockType.OPENING || !block.prev) return;

      const blockCopy = workingCopy(block);

      await decryptPayload(crypto, blockCopy, keySet.aes);
      const scKeySet = JSON.parse(blockCopy.payload) as KeySet;
      if (!scKeySet) throw 'stealthchain opening block without keyset';

      const stealthchain = await getBlockchain(scKeySet);

      if (!stealthchain) return;

      index[scKeySet.sig.publicKey as string] = stealthchain;
    }),
  );

  return index;
}
