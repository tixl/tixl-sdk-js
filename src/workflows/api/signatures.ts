import { Buffer } from 'buffer';
import { Block, Crypto, SigPrivateKey, SigPublicKey, Signature } from '@tixl/tixl-types';

export function generatePrivateKey(crypto: Crypto): Buffer {
  let privateKey;

  do {
    privateKey = crypto.randomBytes(32);
  } while (!crypto.secp256k1.verifyPrivateKey(privateKey));

  return privateKey;
}

export function signatureKeyPair(
  crypto: Crypto,
  privateKey: Buffer,
): { privateKey: SigPrivateKey; publicKey: SigPublicKey } {
  const publicKey = crypto.secp256k1.createPublicKey(privateKey);

  return {
    privateKey: crypto.base58.toString(privateKey),
    publicKey: crypto.base58.toString(publicKey),
  };
}

export function loadPublicSigKey(crypto: Crypto, privateSigKey: SigPrivateKey): SigPublicKey {
  const keyDecoded = crypto.base58.toBytes(privateSigKey as string);
  const publicKey = crypto.secp256k1.createPublicKey(keyDecoded);

  return crypto.base58.toString(publicKey);
}

function payload(crypto: Crypto, message: string): Buffer {
  return Buffer.from(crypto.sha256(message), 'hex');
}

export function signMessage(crypto: Crypto, message: string, privateKey: SigPrivateKey): Signature {
  const decodedKey = crypto.base58.toBytes(privateKey as string);
  const signature = crypto.secp256k1.sign(payload(crypto, message), decodedKey);

  return crypto.base58.toString(signature);
}

export function verify(crypto: Crypto, message: string, signature: string, publicKey: string): boolean {
  return crypto.secp256k1.verify(
    payload(crypto, message),
    crypto.base58.toBytes(signature),
    crypto.base58.toBytes(publicKey),
  );
}

export function verifySignature(crypto: Crypto, block: Block, signature: Signature, publicKey: SigPublicKey) {
  const message = JSON.stringify(block.getDataForSignature());
  return verify(crypto, message, signature as string, publicKey as string);
}

export function signBlock(crypto: Crypto, block: Block, privateKey: SigPrivateKey) {
  const message = JSON.stringify(block.getDataForSignature());
  block.signature = signMessage(crypto, message, privateKey);
}
