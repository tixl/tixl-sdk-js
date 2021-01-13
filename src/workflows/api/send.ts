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

export async function createSendBlock(
  crypto: Crypto,
  prev: Block,
  publicSig: SigPublicKey,
  amount: string | number | bigint,
  balance: string | number | bigint,
  address: SigPublicKey,
  symbol: AssetSymbol,
  signatureKey: SigPrivateKey,
  payload?: string,
): Promise<BlockTx> {
  if (payload && payload.length > 128) throw 'send block payload too long';

  const block = new Block();
  block.type = BlockType.SEND;
  block.symbol = symbol;
  block.createdAt = new Date().getTime();
  block.refAddress = address;
  block.payload = payload;

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
