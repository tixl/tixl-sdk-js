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

import { blockFields } from './open';
import { signBlock } from './signatures';

export async function createDepositBlock(
  _crypto: Crypto,
  prev: Block,
  publicSig: SigPublicKey,
  externalAddress: string,
  amount: string | number | bigint,
  balance: string | number | bigint,
  symbol: AssetSymbol,
  claimSignature?: string,
  signatureKey?: SigPrivateKey,
): Promise<BlockTx> {
  const block = new Block();
  block.type = BlockType.DEPOSIT;
  block.createdAt = new Date().getTime();
  block.claimSignature = claimSignature;
  block.refAsset = externalAddress;

  await blockFields(block, { prev, amount, balance });

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
