import JSBI from 'jsbi';

import { Blockchain, Crypto, BlockType, KeySet, Block, AssetSymbol } from '@tixl/tixl-types';
import { decryptPayload, decryptSender } from './api/encryption';
import { workingCopy } from './utils';

/**
 * Sum the sender balances of the blockchains.
 * All blockchains need to be senderDecrypted!
 *
 * @returns sum of the balances
 */
export async function sumBalance(blocks: Block[]): Promise<string> {
  let sum = JSBI.BigInt(0);

  blocks.map((block) => {
    const balance = JSBI.BigInt(block.senderBalance);

    sum = JSBI.add(sum, balance);
  });

  return sum.toString();
}

/**
 * Calculate the balance across all found blockchains (account and stealth).
 *
 * @returns the balance
 */
export async function calcBalance(
  crypto: Crypto,
  blockchain: Blockchain,
  keySet: KeySet,
  loader: Record<string, Blockchain | undefined>,
  symbol: AssetSymbol,
): Promise<string> {
  const blockchainCopy = workingCopy(blockchain);
  const balanceBlocks: Block[] = [];

  // TODO remove? expect an accountchain to store TIXL
  if (symbol === AssetSymbol.TXL) {
    // add accountchain leaf block to sum
    const acLeaf = blockchainCopy.leaf();
    if (!acLeaf) throw 'accountchain without leaf block';

    const acLeafCopy = workingCopy(acLeaf);
    await decryptSender(crypto, acLeafCopy, keySet.aes);

    balanceBlocks.push(acLeafCopy);
  }

  // add stealthchain leaf blocks to sum
  await Promise.all(
    blockchainCopy.blocks.map(async (block) => {
      if (block.type !== BlockType.OPENING || !block.prev) return;

      const blockCopy = workingCopy(block);

      await decryptPayload(crypto, blockCopy, keySet.aes);
      const scKeySet = JSON.parse(blockCopy.payload) as KeySet;
      if (!scKeySet) throw 'stealthchain opening block without keyset';

      const stealthchain = loader[scKeySet.sig.publicKey as string];

      if (!stealthchain) return;
      if (stealthchain.assetSymbol !== symbol) return;

      const scLeaf = stealthchain.leaf();
      if (!scLeaf) return;

      const scLeafCopy = workingCopy(scLeaf);
      await decryptSender(crypto, scLeafCopy, scKeySet.aes);

      balanceBlocks.push(scLeafCopy);
    }),
  );

  return sumBalance(balanceBlocks);
}
