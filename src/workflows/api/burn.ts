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

export async function createBurnBlock(
  crypto: Crypto,
  prev: Block,
  publicSig: SigPublicKey,
  amount: string | number | bigint,
  balance: string | number | bigint,
  symbol: AssetSymbol,
  signatureKey: SigPrivateKey,
): Promise<BlockTx> {
  const block = new Block();
  block.type = BlockType.BURN;
  block.symbol = symbol;
  block.createdAt = new Date().getTime();

  await blockFields(block, { prev, amount, balance });

  signBlock(crypto, block, signatureKey);

  const tx = new Transaction();

  tx.blocks = [block];
  tx.publicSig = publicSig;
  tx.assetSymbol = symbol;

  return {
    tx,
    block,
  };
}
