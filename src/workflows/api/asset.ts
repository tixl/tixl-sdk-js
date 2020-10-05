import {
  SigPrivateKey,
  Crypto,
  Block,
  BlockType,
  Transaction,
  AssetSymbol,
  BlockTx,
  SigPublicKey,
  BlockchainTx,
  Blockchain,
  KeySet,
} from '@tixl/tixl-types';
import { workingCopy } from '../utils';

import { blockFields } from './open';
import { signBlock } from './signatures';

export async function createAssetBlock(
  _crypto: Crypto,
  publicSig: SigPublicKey,
  symbol: AssetSymbol,
  prev: Block,
  signatureKey: SigPrivateKey,
  payload?: string,
): Promise<BlockTx> {
  const block = new Block();
  block.type = BlockType.ASSET;
  block.refAsset = symbol;
  block.createdAt = new Date().getTime();

  if (payload) {
    block.payload = payload;
  }

  await blockFields(block, { amount: 0, balance: prev.senderBalance, prev });

  signBlock(block, signatureKey);

  const tx = new Transaction(symbol);
  tx.blocks = [block];
  tx.publicSig = publicSig;

  return {
    tx,
    block,
  };
}

export async function assetTx(
  _crypto: Crypto,
  acKeySet: KeySet,
  accountchain: Blockchain,
  symbol: AssetSymbol,
): Promise<BlockchainTx> {
  const accountChainCopy = workingCopy(accountchain);
  const leaf = accountChainCopy.leafAsset(symbol);

  if (!leaf) throw 'accountchain has no leaf block';

  const create = await createAssetBlock(_crypto, acKeySet.sig.publicKey, symbol, leaf, acKeySet.sig.privateKey);

  accountChainCopy.addBlock(create.block);

  return {
    tx: create.tx,
    blockchain: accountChainCopy,
  };
}
