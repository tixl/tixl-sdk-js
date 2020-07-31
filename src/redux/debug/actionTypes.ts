import { SEND_NEXT_TX_INVALID } from './actionKeys';

interface SendNextTxInvalidAction {
  type: typeof SEND_NEXT_TX_INVALID;
  value: boolean;
}

export type GeneralAction = SendNextTxInvalidAction;
