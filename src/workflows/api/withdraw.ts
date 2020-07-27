import {
  AESPrivateKey,
  SigPrivateKey,
  Crypto,
  Block,
  BlockType,
  Transaction,
  BlockTx,
  SigPublicKey,
  AssetSymbol,
} from '@tixl/tixl-types';

import { blockFields } from './open';
import { encryptSender } from './encryption';
import { signBlock } from './signatures';

export async function createWithdrawalBlock(
  crypto: Crypto,
  prev: Block,
  publicSig: SigPublicKey,
  externalAddress: string,
  amount: string | number | bigint,
  balance: string | number | bigint,
  symbol: AssetSymbol,
  signatureKey?: SigPrivateKey,
  aesKey?: AESPrivateKey,
): Promise<BlockTx> {
  const block = new Block();
  block.type = BlockType.WITHDRAWAL;
  block.createdAt = new Date().getTime();
  block.refAsset = externalAddress;

  await blockFields(crypto, block, { prev, amount, balance });

  if (aesKey) {
    await encryptSender(crypto, block, aesKey, { publicFunds: true });
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
