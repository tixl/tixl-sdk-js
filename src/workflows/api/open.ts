import {
  SigPrivateKey,
  Crypto,
  Block,
  BlockType,
  Transaction,
  AssetSymbol,
  BlockTx,
  SigPublicKey,
} from '@tixl/tixl-types';

import { signBlock } from './signatures';

export async function createOpeningBlock(
  _crypto: Crypto,
  balance: string | number | bigint,
  publicSig: SigPublicKey,
  usePrev?: Block,
  signatureKey?: SigPrivateKey,
  payload?: string,
  symbol?: AssetSymbol,
): Promise<BlockTx> {
  const block = new Block();
  block.type = BlockType.OPENING;
  block.createdAt = new Date().getTime();

  if (payload) {
    block.payload = payload;
  }

  const prev = usePrev ? usePrev : undefined;

  await blockFields(block, { amount: 0, balance, prev });

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

export type BlockFields = {
  amount: string | number | bigint;
  balance: string | number | bigint;
  prev?: Block;
  ref?: Block;
};

/**
 * Setup common fields on a block.
 */
export async function blockFields(block: Block, fields: BlockFields): Promise<Block> {
  block.setAmount(fields.amount, fields.balance, fields.prev);

  return block;
}
