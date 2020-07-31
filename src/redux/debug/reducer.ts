import { GeneralAction } from './actionTypes';
import { SEND_NEXT_TX_INVALID } from './actionKeys';

export interface DebugReduxState {
  sendNextTxInvalid: boolean;
}

const initialState: DebugReduxState = {
  sendNextTxInvalid: false,
};

export function reducer(state = initialState, action: GeneralAction) {
  switch (action.type) {
    case SEND_NEXT_TX_INVALID:
      return {
        ...state,
        sendNextTxInvalid: action.value,
      };
    default:
      return state;
  }
}
