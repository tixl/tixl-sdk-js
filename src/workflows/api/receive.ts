import {
  AESPrivateKey,
  SigPrivateKey,
  Crypto,
  Block,
  BlockType,
  Transaction,
  AssetSymbol,
  BlockTx,
  SigPublicKey,
} from '@tixl/tixl-types';

import { blockFields } from './open';
import { encryptSender } from './encryption';
import { signBlock } from './signatures';

export async function createReceiveBlock(
  crypto: Crypto,
  prev: Block,
  send: Block,
  publicSig: SigPublicKey,
  amount: string | number | bigint,
  balance: string | number | bigint,
  symbol: AssetSymbol,
  signatureKey?: SigPrivateKey,
  aesKey?: AESPrivateKey,
): Promise<BlockTx> {
  const block = new Block();
  block.type = BlockType.RECEIVE;
  block.createdAt = new Date().getTime();
  block.refBlock = send.signature;

  await blockFields(crypto, block, { ref: send, prev, amount, balance });

  if (aesKey) {
    await encryptSender(crypto, block, aesKey);
  }

  if (signatureKey) {
    signBlock(block, signatureKey);
  }

  const tx = new Transaction(symbol);
  tx.blocks = [block];
  tx.publicSig = publicSig;

  return {
    tx,
    block,
  };
}
