import {
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
import { signBlock } from './signatures';

export async function createWithdrawalBlock(
  _crypto: Crypto,
  prev: Block,
  publicSig: SigPublicKey,
  externalAddress: string,
  amount: string | number | bigint,
  balance: string | number | bigint,
  symbol: AssetSymbol,
  signatureKey?: SigPrivateKey,
): Promise<BlockTx> {
  const block = new Block();
  block.type = BlockType.WITHDRAWAL;
  block.createdAt = new Date().getTime();
  block.refAsset = externalAddress;

  await blockFields(block, { prev, amount, balance });

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
