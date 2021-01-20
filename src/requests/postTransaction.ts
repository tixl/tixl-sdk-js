import axios from 'axios';
import { Transaction } from '@tixl/tixl-types';
import flatMap from 'lodash/flatMap';

import { getGatewayUrl } from '../helpers/env';
import { GatewayErrors } from '../helpers/errors';
import { workingCopy } from '../workflows/utils';

export type PostTxResponse = {
  hash: string;
};

export async function postTransactionBody(body: any): Promise<PostTxResponse | GatewayErrors> {
  console.log('sending tx to gateway: ', body);

  return axios
    .post<PostTxResponse>(getGatewayUrl() + '/transaction', body)
    .then((res) => {
      if (res && res.data) {
        console.log('gateway responded', { hash: res.data.hash });
      }

      return res.data;
    })
    .catch((err) => {
      if (!err.response) {
        console.error('gateway is unresponsive');
      } else if (err.response.status === 429) {
        return GatewayErrors.RATE_LIMIT;
      } else if (err.response.status !== 404) {
        console.log('err', err);
      }

      return GatewayErrors.UNRESPONSIVE;
    });
}

export async function postTransaction(transaction: Transaction): Promise<PostTxResponse | GatewayErrors> {
  return postTransactionBody({ transaction });
}

export async function mergePostTransactions(transactions: Transaction[]): Promise<PostTxResponse | GatewayErrors> {
  if (!transactions || transactions.length === 0) throw new Error('No transactions to post');

  const tx = workingCopy(transactions[0]);
  const blocks = flatMap(transactions, (tx) => tx.blocks);

  tx.blocks = blocks;

  return postTransaction(tx);
}
