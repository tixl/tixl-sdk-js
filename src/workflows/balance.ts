import JSBI from 'jsbi';

import { Blockchain, Crypto, KeySet, Block, AssetSymbol } from '@tixl/tixl-types';
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
  _crypto: Crypto,
  blockchain: Blockchain,
  _keySet: KeySet,
  symbol: AssetSymbol,
): Promise<string> {
  const blockchainCopy = workingCopy(blockchain);
  const assetBlock = blockchainCopy.leafAsset(symbol);

  if (!assetBlock) return '0';

  return assetBlock.senderBalance;
}
