import JSBI from 'jsbi';
import {
  Block,
  BlockType,
  Crypto,
  AESPrivateKey,
  NTRUPublicKey,
  NTRUPrivateKey,
  fromBlockObject,
} from '@tixl/tixl-types';

export type EncryptSenderOpt = {
  forceDecryptBF?: boolean;
  publicFunds?: boolean;
};

export async function encryptSender(crypto: Crypto, block: Block, aesKey: AESPrivateKey, opts?: EncryptSenderOpt) {
  const keyDecoded = crypto.base64.toBytes(aesKey);
  const publicFunds = !opts || opts.publicFunds === undefined ? false : opts.publicFunds;

  const senderAmount = async () => {
    if (publicFunds) return;
    block.senderAmount = await crypto.aes.encrypt(block.senderAmount, keyDecoded);
  };

  const senderBalance = async () => {
    if (publicFunds) return;
    block.senderBalance = await crypto.aes.encrypt(block.senderBalance, keyDecoded);
  };

  const senderBFBalance = async () => {
    block.senderBlindingFactorBalance = await crypto.aes.encrypt(block.senderBlindingFactorBalance, keyDecoded);
  };

  const payload = async () => {
    if (!block.payload) return;
    block.payload = await crypto.aes.encrypt(block.payload, keyDecoded);
  };

  return Promise.all([senderAmount(), senderBalance(), senderBFBalance(), payload()]).then(() => {
    return fromBlockObject(block);
  });
}

function maybePublic(value: string): boolean {
  try {
    JSBI.BigInt(value);
    return true;
  } catch (err) {
    return false;
  }
}

export async function decryptSender(crypto: Crypto, block: Block, aesKey: AESPrivateKey, opts?: EncryptSenderOpt) {
  const forceDecryptBF = !opts || opts.forceDecryptBF === undefined ? false : opts.forceDecryptBF;
  const publicFunds = !opts || opts.publicFunds === undefined ? false : opts.publicFunds;

  const keyDecoded = crypto.base64.toBytes(aesKey);

  const senderAmount = async () => {
    if (publicFunds) return;
    if (maybePublic(block.senderAmount)) return;

    const val = await crypto.aes.decrypt(block.senderAmount, keyDecoded);
    block.senderAmount = val.toString();
  };

  const senderBalance = async () => {
    if (publicFunds) return;
    if (maybePublic(block.senderBalance)) return;

    const val = await crypto.aes.decrypt(block.senderBalance, keyDecoded);
    block.senderBalance = val.toString();
  };

  const senderBf = async () => {
    if (forceDecryptBF || block.type !== BlockType.OPENING || (block.type === BlockType.OPENING && block.prev)) {
      const senderFactor = await crypto.aes.decrypt(block.senderBlindingFactorBalance, keyDecoded);
      block.senderBlindingFactorBalance = senderFactor.toString();
    }
  };

  return Promise.all([senderAmount(), senderBalance(), senderBf()]).then(() => {
    return fromBlockObject(block);
  });
}

export async function encryptReceiver(crypto: Crypto, block: Block, receiverKey: NTRUPublicKey) {
  const keyDecoded = crypto.base64.toBytes(receiverKey);

  const receiverAmount = async () => {
    if (!block.receiverAmount) return;
    block.receiverAmount = await crypto.ntru.encrypt(block.receiverAmount, keyDecoded);
  };

  const receiverBFAmount = async () => {
    if (!block.receiverBlindingFactorAmount) return;
    block.receiverBlindingFactorAmount = await crypto.ntru.encrypt(block.receiverBlindingFactorAmount, keyDecoded);
  };

  return Promise.all([receiverAmount(), receiverBFAmount()]).then(() => {
    return fromBlockObject(block);
  });
}

export async function decryptReceiver(crypto: Crypto, block: Block, receiverKey: NTRUPrivateKey) {
  const keyDecoded = crypto.base64.toBytes(receiverKey);

  const receiverAmount = async () => {
    if (!block.receiverAmount) return;
    block.receiverAmount = await crypto.ntru.decrypt(block.receiverAmount, keyDecoded);
  };

  const receiverBFAmount = async () => {
    if (!block.receiverBlindingFactorAmount) return;
    block.receiverBlindingFactorAmount = await crypto.ntru.decrypt(block.receiverBlindingFactorAmount, keyDecoded);
  };

  return Promise.all([receiverAmount(), receiverBFAmount()]).then(() => {
    return fromBlockObject(block);
  });
}

export async function decryptReceiverAmount(
  crypto: Crypto,
  receiverAmount: string,
  receiverKey: NTRUPrivateKey,
): Promise<string> {
  const keyDecoded = crypto.base64.toBytes(receiverKey);
  return crypto.ntru.decrypt(receiverAmount, keyDecoded);
}

export async function decryptPayload(crypto: Crypto, block: Block, aesKey: AESPrivateKey) {
  const keyDecoded = crypto.base64.toBytes(aesKey);

  block.payload = await crypto.aes.decrypt(block.payload, keyDecoded);

  return fromBlockObject(block);
}
