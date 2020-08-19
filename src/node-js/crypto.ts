import crypto from 'crypto';
import aesjs from 'aes-js';
import { commit, blindSum, rangeProofSign } from '@tixl/tixl-pedersen-commitments';
import { Crypto } from '@tixl/tixl-types';

import { encrypt as NTRUenc, decrypt as NTRUdec, keyPair } from './encryption/NTRU';
import pad16Bytes from '../helpers/pad';

/**
 * Creates the crypto environment for nodejs.
 */
export function createCrypto(): Crypto {
  return {
    randomBytes(len: number) {
      return crypto.randomBytes(len);
    },
    ntru: {
      async encrypt(what: string | String, key: any) {
        return NTRUenc(key, what as string);
      },
      async decrypt(what: string | String, key: any) {
        return NTRUdec(key, what as string);
      },
      async keyPair(seed?: any) {
        return keyPair();
      },
    },
    aes: {
      async encrypt(what: string | String, key: any) {
        if (!what) return '';

        const iv = crypto.randomBytes(16);
        const aes256 = new aesjs.ModeOfOperation.cbc(key, iv);
        const asBytes = aesjs.utils.utf8.toBytes(pad16Bytes(what as string));

        const encrypted = Buffer.from(aes256.encrypt(asBytes)).toString('base64');
        const ivEncoded = Buffer.from(iv).toString('base64');

        return [ivEncoded, encrypted].join(':');
      },
      async decrypt(what: string | String, key: any) {
        if (!what) return '';

        const [ivEncoded, encrypted] = what.split(':');

        if (!ivEncoded || !encrypted) return '';

        const iv = Buffer.from(ivEncoded, 'base64');
        const payload = Buffer.from(encrypted, 'base64');
        const aes256 = new aesjs.ModeOfOperation.cbc(key, iv);

        return aesjs.utils.utf8.fromBytes(aes256.decrypt(payload)).trim();
      },
    },
    base64: {
      toBytes(payload: string | String) {
        return Buffer.from(payload as string, 'base64');
      },
      toString(payload: any) {
        return Buffer.from(payload).toString('base64');
      },
    },
    secp256k1: {
      commit(bf: any, amount: string | String) {
        return commit(bf, amount as string);
      },
      blindSum,
      rangeProofSign,
    },
  };
}
