import randomBytes from 'randombytes';
import aesjs from 'aes-js';
import b64 from 'base64-js';
import { Crypto } from '@tixl/tixl-types';

// TODO: add real declarations
interface GlobalSelf {
  ntru: any;
  secp256k1: any;
}

// @ts-ignore
const workerGlobal: GlobalSelf = self;

// append spaces until the text is a multiple of 16 bytes long
function pad16Bytes(text: string) {
  if (!text) return text;

  const diff = text.length % 16;

  if (diff === 0) return text;

  const pad = 17 - diff;
  return text + Array(pad).join(' ');
}

export function validKeyLength(key: string | String): boolean {
  return typeof key === 'string' && key.length % 4 === 0;
}

/**
 * Creates the crypto environment for the browser.
 */
export default function createCrypto(): Crypto {
  return {
    randomBytes,
    ntru: {
      async encrypt(what: string | String, key: any) {
        return b64.fromByteArray(await workerGlobal.ntru.encrypt(aesjs.utils.utf8.toBytes(what as string), key));
      },
      async decrypt(what: string | String, key: any) {
        if (!what) return '';

        return aesjs.utils.utf8.fromBytes(await workerGlobal.ntru.decrypt(b64.toByteArray(what as string), key));
      },
      async keyPair(seed: any) {
        return workerGlobal.ntru.keyPair(seed);
      },
    },
    aes: {
      async encrypt(what: string | String, key: any) {
        if (!what) return '';

        const iv = randomBytes(16);
        const aes256 = new aesjs.ModeOfOperation.cbc(key, iv);
        const asBytes = aesjs.utils.utf8.toBytes(pad16Bytes(what as string));

        const encrypted = b64.fromByteArray(aes256.encrypt(asBytes));
        const ivEncoded = b64.fromByteArray(iv);

        return [ivEncoded, encrypted].join(':');
      },
      async decrypt(what: string | String, key: any) {
        if (!what) return '';

        const [ivEncoded, encrypted] = what.split(':');

        if (!ivEncoded || !encrypted) return '';

        const iv = b64.toByteArray(ivEncoded);
        const payload = b64.toByteArray(encrypted);
        const aes256 = new aesjs.ModeOfOperation.cbc(key, iv);

        return aesjs.utils.utf8.fromBytes(aes256.decrypt(payload));
      },
    },
    base64: {
      toBytes(payload: string | String) {
        return b64.toByteArray(payload as string);
      },
      toString(payload: any) {
        return b64.fromByteArray(payload);
      },
    },
    secp256k1: workerGlobal.secp256k1,
  };
}
