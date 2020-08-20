import { Crypto, KeySet, SigPublicKey, AESPrivateKey, Blockchain } from '@tixl/tixl-types';
import { Buffer } from 'buffer';

import { ntruKeyPair } from './ntru';
import { signatureKeyPair, generatePrivateKey } from './signatures';
import { decryptPayload } from './encryption';

export async function keySet(crypto: Crypto): Promise<KeySet> {
  return keySetSeeded(crypto, generatePrivateKey(crypto));
}

export async function keySetSeeded(crypto: Crypto, privateKey: string): Promise<KeySet> {
  const pkBuffer = Buffer.from(privateKey);
  const aes = crypto.base64.toString(pkBuffer);
  const sig = signatureKeyPair(pkBuffer);
  const ntru = await ntruKeyPair(crypto);

  return {
    aes,
    sig,
    ntru,
  };
}

export async function keySetFromAccountchain(
  crypto: Crypto,
  accountchain: Blockchain,
  aesKey: AESPrivateKey,
): Promise<KeySet> {
  const open = accountchain.openingBlock();

  if (!open) throw new Error('Accountchain without opening block');

  await decryptPayload(crypto, open, aesKey);

  const payload = JSON.parse(open.payload);

  return payload as KeySet;
}

export async function getPublicSig(crypto: Crypto, aesKey: AESPrivateKey): Promise<SigPublicKey> {
  const privateKey = Buffer.from(crypto.base64.toBytes(aesKey));
  const sig = signatureKeyPair(privateKey);

  return sig.publicKey;
}
