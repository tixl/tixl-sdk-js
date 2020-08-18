// @ts-ignore
import tixlNtru from '@tixl/tixl-ntru';
import { NTRUPublicKey, NTRUPrivateKey } from '@tixl/tixl-types';

export function keyPair(seed?: any) {
  const pair = tixlNtru.createKey();

  return {
    publicKey: pair.public,
    privateKey: pair.private,
  };
}

export function encrypt(publicKey: NTRUPublicKey, value: string) {
  const valBuff = Buffer.from(value);

  if (valBuff.byteLength > 100) {
    throw 'cannot encrypt longer values with NTRU';
  }

  return tixlNtru.encrypt(valBuff, Buffer.from(publicKey as string, 'base64')).toString('base64');
}

export function decrypt(privateKey: NTRUPrivateKey, value: string) {
  return tixlNtru.decrypt(Buffer.from(value, 'base64'), Buffer.from(privateKey as string, 'base64')).toString();
}
