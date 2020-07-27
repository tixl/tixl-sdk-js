import secp256k1 from 'secp256k1';
import bs58 from 'bs58';
import { sha256 } from 'js-sha256';
import { Buffer } from 'buffer';
import { Block, Crypto, SigPrivateKey, SigPublicKey } from '@tixl/tixl-types';

export function generatePrivateKey(crypto: Crypto) {
  let privateKey;

  do {
    privateKey = crypto.randomBytes(32);
  } while (!secp256k1.privateKeyVerify(privateKey));

  return privateKey;
}

export function signatureKeyPair(privateKey: any): { privateKey: SigPrivateKey; publicKey: SigPublicKey } {
  const publicKey = secp256k1.publicKeyCreate(privateKey);

  return {
    privateKey: bs58.encode(privateKey),
    publicKey: bs58.encode(publicKey),
  };
}

export function loadPublicSigKey(privateSigKey: SigPrivateKey): SigPublicKey {
  const keyDecoded = bs58.decode(privateSigKey as string);
  const publicKey = secp256k1.publicKeyCreate(keyDecoded);

  return bs58.encode(publicKey);
}

export function signBlock(block: Block, privateKey: SigPrivateKey) {
  const message = JSON.stringify(block.getDataForSignature());
  block.signature = signMessage(message, privateKey);
}

export function signMessage(message: string, privateKey: SigPrivateKey) {
  const decodedKey = bs58.decode(privateKey as string);
  const { signature } = secp256k1.sign(Buffer.from(sha256(message), 'hex'), decodedKey);

  return bs58.encode(signature);
}
