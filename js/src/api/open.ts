import {
  AESPrivateKey,
  SigPrivateKey,
  NTRUPublicKey,
  Crypto,
  Block,
  BlockType,
  Transaction,
  AssetSymbol,
  BlockTx,
  SigPublicKey,
} from '@tixl/tixl-types';

import { setCommitments } from './commitments';
import { encryptReceiver, encryptSender } from './encryption';
import { signBlock } from './signatures';

export async function createOpeningBlock(
  crypto: Crypto,
  balance: string | number | bigint,
  publicSig: SigPublicKey,
  usePrev?: Block,
  signatureKey?: SigPrivateKey,
  encryptionKey?: NTRUPublicKey,
  publishBF?: boolean,
  payload?: string,
  aesKey?: AESPrivateKey,
  symbol?: AssetSymbol,
): Promise<BlockTx> {
  const block = new Block();
  block.type = BlockType.OPENING;
  block.createdAt = new Date().getTime();

  if (payload) {
    block.payload = payload;
  }

  const prev = usePrev ? usePrev : undefined;

  await blockFields(crypto, block, { amount: 0, balance, prev });

  const sendBF = block.senderBlindingFactorBalance;

  if (encryptionKey) {
    block.publicNtruKey = encryptionKey;
    await encryptReceiver(crypto, block, encryptionKey);
  }

  if (aesKey) {
    await encryptSender(crypto, block, aesKey);
  }

  if (publishBF) {
    // if it is encrypted, restore it to the unencrypted value
    block.senderBlindingFactorBalance = sendBF;
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

export type BlockFields = {
  amount: string | number | bigint;
  balance: string | number | bigint;
  prev?: Block;
  ref?: Block;
};

/**
 * Setup common fields on a block.
 */
export async function blockFields(crypto: Crypto, block: Block, fields: BlockFields): Promise<Block> {
  block.setAmount(fields.amount, fields.balance, fields.prev);

  setCommitments(
    crypto,
    {
      type: block.type,
      amount: fields.amount,
      balance: fields.balance,
    },
    block,
    fields.prev,
    fields.ref,
  );

  return block;
}
