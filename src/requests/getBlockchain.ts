import axios from 'axios';
import { KeySet, Blockchain, SigPublicKey, fromBlockchainObject } from '@tixl/tixl-types';

import { getGatewayUrl } from '../helpers/env';

export function getBlockchain(keySet: KeySet) {
  return fetchBlockchain(keySet && keySet.sig.publicKey);
}

export class BlockchainNotFoundError extends Error {
  static errorName = 'BlockchainNotFoundError';
  constructor(message: string) {
    super(message);
    this.name = BlockchainNotFoundError.errorName;
  }
}

export default function fetchBlockchain(sig: SigPublicKey): Promise<Blockchain> {
  return axios
    .get(getGatewayUrl() + `/blockchain?signaturePublicKey=${sig}&full=true`)
    .then((res) => {
      if (!res.data || !res.data.blockchain) {
        throw new BlockchainNotFoundError(`Could not find blockchain for ${sig}`);
      }

      return fromBlockchainObject(res.data.blockchain);
    })
    .catch((err) => {
      if (!err.response) {
        throw err;
      } else if (err.response.status === 404) {
        throw new BlockchainNotFoundError(`Could not find blockchain for ${sig}`);
      } else {
        throw err;
      }
    });
}
