import { KeySet, Crypto } from '@tixl/tixl-types';

import { keySet } from '../workflows/api/keyset';

export default function (crypto: Crypto) {
  return {
    async keySet(): Promise<KeySet> {
      return keySet(crypto);
    },
  };
}
