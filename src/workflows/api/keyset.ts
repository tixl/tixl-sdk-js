import { Crypto, KeySet, SigPublicKey, SigPrivateKey } from '@tixl/tixl-types';
import { Buffer } from 'buffer';

import { signatureKeyPair, generatePrivateKey } from './signatures';

export async function keySet(crypto: Crypto): Promise<KeySet> {
  return keySetSeeded(crypto, generatePrivateKey(crypto));
}

export async function keySetSeeded(_crypto: Crypto, privateKey: string): Promise<KeySet> {
  const pkBuffer = Buffer.from(privateKey);
  const sig = signatureKeyPair(pkBuffer);

  return {
    sig,
  };
}

export async function keySetFromPk(_crypto: Crypto, sigPK: SigPrivateKey): Promise<KeySet> {
  const sig = signatureKeyPair(sigPK);

  return {
    sig,
  };
}

export async function getPublicSig(crypto: Crypto, sigPK: SigPrivateKey): Promise<SigPublicKey> {
  const privateKey = Buffer.from(crypto.base64.toBytes(sigPK));
  const sig = signatureKeyPair(privateKey);

  return sig.publicKey;
}
