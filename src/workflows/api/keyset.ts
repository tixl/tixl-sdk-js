import { Crypto, KeySet } from '@tixl/tixl-types';
import { Buffer } from 'buffer';

import { signatureKeyPair, generatePrivateKey } from './signatures';

export async function keySet(crypto: Crypto): Promise<KeySet> {
  return keySetSeeded(crypto, generatePrivateKey(crypto));
}

export async function keySetSeeded(crypto: Crypto, privateKey: Uint8Array): Promise<KeySet> {
  const pkBuffer = Buffer.from(privateKey);
  const sig = signatureKeyPair(crypto, pkBuffer);

  return {
    sig,
  };
}
