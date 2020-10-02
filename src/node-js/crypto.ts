import crypto from 'crypto';
import { Crypto } from '@tixl/tixl-types';

/**
 * Creates the crypto environment for nodejs.
 */
export function createCrypto(): Crypto {
  return {
    randomBytes(len: number) {
      return crypto.randomBytes(len);
    },
    base64: {
      toBytes(payload: string | String) {
        return Buffer.from(payload as string, 'base64');
      },
      toString(payload: any) {
        return Buffer.from(payload).toString('base64');
      },
    },
  };
}
