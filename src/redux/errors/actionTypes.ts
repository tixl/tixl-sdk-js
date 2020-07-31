import { ADD_LOGGED_ERROR } from './actionKeys';

export interface AddLoggedErrorAction {
  type: typeof ADD_LOGGED_ERROR;
  timestamp: number;
  error: Error;
}

export type GeneralAction = AddLoggedErrorAction;
