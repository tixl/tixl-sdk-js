import crypto from 'crypto';
import base58 from 'bs58';
import { sha256 } from 'js-sha256';
import { instantiateSecp256k1, Secp256k1 } from '@bitauth/libauth';
import { Crypto } from '@tixl/tixl-types';

let secp256k1: Secp256k1;

export const init = new Promise<void>(async (resolve) => {
  secp256k1 = await instantiateSecp256k1();
  resolve();
});

/**
 * Creates the crypto environment for nodejs.
 */
export function createCrypto(): Crypto {
  return {
    randomBytes(len: number) {
      return crypto.randomBytes(len);
    },
    sha256(message: string) {
      return sha256(message);
    },
    base58: {
      toBytes(payload: string) {
        return base58.decode(payload);
      },
      toString(payload: Buffer) {
        return base58.encode(payload);
      },
    },
    secp256k1: {
      verify(message: Buffer, signature: Buffer, publicKey: Buffer) {
        if (!secp256k1) throw new Error('secp256k1 not initialized yet');
        return secp256k1.verifySignatureCompactLowS(signature, publicKey, message);
      },
      sign(message: Buffer, privateKey: Buffer) {
        if (!secp256k1) throw new Error('secp256k1 not initialized yet');
        return Buffer.from(secp256k1.signMessageHashCompact(privateKey, message));
      },
      verifyPrivateKey(privateKey: Buffer) {
        if (!secp256k1) throw new Error('secp256k1 not initialized yet');
        return secp256k1.validatePrivateKey(privateKey);
      },
      createPublicKey(privateKey: Buffer) {
        if (!secp256k1) throw new Error('secp256k1 not initialized yet');
        return Buffer.from(secp256k1.derivePublicKeyCompressed(privateKey));
      },
    },
  };
}
