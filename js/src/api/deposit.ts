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

export async function createDepositBlock(
  crypto: Crypto,
  prev: Block,
  publicSig: SigPublicKey,
  externalAddress: string,
  amount: string | number | bigint,
  balance: string | number | bigint,
  symbol: AssetSymbol,
  claimSignature?: string,
  signatureKey?: SigPrivateKey,
  aesKey?: AESPrivateKey,
): Promise<BlockTx> {
  const block = new Block();
  block.type = BlockType.DEPOSIT;
  block.createdAt = new Date().getTime();
  block.claimSignature = claimSignature;
  block.refAsset = externalAddress;

  await blockFields(crypto, block, { prev, amount, balance });

  if (aesKey) {
    await encryptSender(crypto, block, aesKey, { publicFunds: true });
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
