import {
  AESPrivateKey,
  SigPrivateKey,
  NTRUPublicKey,
  Crypto,
  Block,
  BlockType,
  Transaction,
  BlockTx,
  SigPublicKey,
  AssetSymbol,
} from '@tixl/tixl-types';

import { blockFields } from './open';
import { encryptReceiver, encryptSender } from './encryption';
import { signBlock } from './signatures';

export async function createSendBlock(
  crypto: Crypto,
  prev: Block,
  publicSig: SigPublicKey,
  amount: string | number | bigint,
  balance: string | number | bigint,
  symbol: AssetSymbol,
  signatureKey?: SigPrivateKey,
  receiverKey?: NTRUPublicKey,
  aesKey?: AESPrivateKey,
): Promise<BlockTx> {
  const block = new Block();
  block.type = BlockType.SEND;
  block.createdAt = new Date().getTime();

  await blockFields(crypto, block, { prev, amount, balance });

  if (receiverKey) {
    await encryptReceiver(crypto, block, receiverKey);
  }

  if (aesKey) {
    await encryptSender(crypto, block, aesKey);
  }

  if (signatureKey) {
    signBlock(block, signatureKey);
  }

  const tx = new Transaction();
  tx.blocks = [block];
  tx.publicSig = publicSig;
  tx.assetSymbol = symbol;

  return {
    tx,
    block,
  };
}
