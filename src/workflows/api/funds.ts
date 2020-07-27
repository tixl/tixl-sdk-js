import JSBI from 'jsbi';
import { KeySet, Blockchain, BlockType, Crypto, AssetSymbol } from '@tixl/tixl-types';

import { decryptPayload, decryptSender } from './encryption';
import { workingCopy } from '../utils';

/**
 * Used to search for sufficient funds on an account.
 * If a user wants to send 15 Tixl spread across 3 stealthchains
 * a workflow can save results with this type to work with it.
 */
export type SearchFundResult = {
  keySet: KeySet;
  stealthChain: Blockchain;
  amount: string;
};

export async function searchFunds(
  crypto: Crypto,
  accountchain: Blockchain,
  acKeySet: KeySet,
  amount: string | number | bigint,
  symbol: AssetSymbol,
  loader: Record<string, Blockchain | undefined>,
): Promise<SearchFundResult[] | false> {
  const accountchainCopy = workingCopy(accountchain);
  const result: SearchFundResult[] = [];
  let amountLeft = JSBI.BigInt(amount.toString());

  await Promise.all(
    accountchainCopy.blocks.map(async (block) => {
      if (block.type !== BlockType.OPENING || !block.prev) return;

      if (JSBI.LE(amountLeft, 0)) return;

      const blockCopy = workingCopy(block);

      await decryptPayload(crypto, blockCopy, acKeySet.aes);
      const scKeySet = JSON.parse(blockCopy.payload) as KeySet;
      if (!scKeySet) throw 'stealthchain opening block without keyset';

      const stealthchain = loader[scKeySet.sig.publicKey as string];

      if (!stealthchain) return;
      if (stealthchain.assetSymbol !== symbol) return;

      const scLeaf = stealthchain.leaf();
      if (!scLeaf) return;

      const scLeafCopy = workingCopy(scLeaf);
      await decryptSender(crypto, scLeafCopy, scKeySet.aes);

      const blockAmount = JSBI.BigInt(scLeafCopy.senderBalance);
      let useAmount;

      if (JSBI.LE(amountLeft, blockAmount)) {
        useAmount = amountLeft;
      } else {
        useAmount = blockAmount;
      }

      // mark stealthchain for result
      result.push({
        keySet: scKeySet,
        amount: useAmount.toString(),
        stealthChain: stealthchain,
      });

      // reduce left amount
      amountLeft = JSBI.subtract(amountLeft, useAmount);
    }),
  );

  return result;
}
