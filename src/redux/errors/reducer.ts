import { GeneralAction } from './actionTypes';
import { ADD_LOGGED_ERROR } from './actionKeys';

export type ErrorsReduxState = LoggedError[];

export interface LoggedError {
  error: Error;
  timestamp: number;
}

export function reducer(state: LoggedError[] = [], action: GeneralAction) {
  switch (action.type) {
    case ADD_LOGGED_ERROR:
      return ([] as LoggedError[]).concat(state).concat([{ error: action.error, timestamp: action.timestamp }]);
    default:
      return state;
  }
}
