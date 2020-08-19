import bs58 from 'bs58';
import secp256k1 from 'secp256k1';
import { sha256 } from 'js-sha256';
import { Signature, SigPublicKey } from '@tixl/tixl-types';

export function verify(message: string, signature: Signature, publicKey: SigPublicKey): boolean {
  return secp256k1.verify(
    Buffer.from(sha256(message), 'hex'),
    bs58.decode(signature as string),
    bs58.decode(publicKey as string),
  );
}

export function verifySignature(payload: Object, signature: Signature, publicKey: SigPublicKey) {
  return verify(JSON.stringify(payload), signature, publicKey);
}
