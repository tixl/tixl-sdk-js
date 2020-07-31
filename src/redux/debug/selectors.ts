import { RootState } from '..';

export const shouldSendNextTxInvalid = (state: RootState) => state.debug.sendNextTxInvalid;
