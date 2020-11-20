import JSBI from 'jsbi';
import { Blockchain, AssetSymbol, Block } from '@tixl/tixl-types';

import { workingCopy } from '../utils';

export type SearchFundResult = {
  prev: Block;
  amount: string;
};

export async function searchFunds(
  accountchain: Blockchain,
  amount: string | number | bigint,
  symbol: AssetSymbol,
): Promise<SearchFundResult | false> {
  const accountchainCopy = workingCopy(accountchain);
  const amountToSend = JSBI.BigInt(amount.toString());
  const leaf = accountchainCopy.leafAsset(symbol);

  // no asset branch
  if (!leaf) return false;

  const leafBalance = JSBI.BigInt(leaf.senderBalance);

  // insufficient funds
  if (JSBI.LT(leafBalance, amountToSend)) return false;

  return {
    prev: leaf,
    amount: amount.toString(),
  };
}
