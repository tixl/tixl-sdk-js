import { SEND_NEXT_TX_INVALID } from './actionKeys';

export const sendNextTxInvalid = (value: boolean) => ({
  type: SEND_NEXT_TX_INVALID,
  value,
});
