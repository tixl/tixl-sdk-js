import { Transaction } from '@tixl/tixl-types';
import flatMap from 'lodash/flatMap';

import { workingCopy } from '../workflows/utils';

export function mergeTransactions(transactions: Transaction[]): Transaction {
  const tx = workingCopy(transactions[0]);
  const blocks = flatMap(transactions, (tx) => tx.blocks);

  tx.blocks = blocks;

  return tx;
}
