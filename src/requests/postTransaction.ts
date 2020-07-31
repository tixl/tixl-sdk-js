import axios from 'axios';
import { Transaction, Block } from '@tixl/tixl-types';

import { GatewayErrors } from '../helpers/errors';
import { calculateDoublePow } from '../lib/microPow';

const powTarget = [
  { pos: 0, character: '0' },
  { pos: 1, character: '0' },
  { pos: 2, character: '0' },
  { pos: 3, character: '0' },
];

const powTargetAlt = [
  { pos: 0, character: '1' },
  { pos: 1, character: '1' },
  { pos: 2, character: '1' },
  { pos: 3, character: '1' },
];

export type PostTxResponse = {
  hash: string;
};

function addPowToBlock(block: Block) {
  console.time('Calculate microPow');
  const nonce = calculateDoublePow(block.signature as string, powTarget, powTargetAlt);
  console.timeEnd('Calculate microPow');
  console.log('Nonce :' + nonce);
  return { ...block, nonce };
}

export async function postTransactionBody(body: any): Promise<PostTxResponse | GatewayErrors> {
  console.log('sending tx to gateway: ', body);

  if (body.transaction) {
    body.transaction.blocks = (body.transaction as Transaction).blocks.map(addPowToBlock);
  }
  if (body.transactions) {
    body.transactions = body.transactions.map((tx: Transaction) => ({ ...tx, blocks: tx.blocks.map(addPowToBlock) }));
  }

  return axios
    .post<PostTxResponse>(process.env.REACT_APP_GATEWAY + '/transaction', body)
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

export async function postTransactions(transactions: Transaction[]): Promise<PostTxResponse | GatewayErrors> {
  return postTransactionBody({ transactions });
}
