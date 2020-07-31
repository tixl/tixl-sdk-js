import { ADD_LOGGED_ERROR } from './actionKeys';
import { AddLoggedErrorAction } from './actionTypes';

export function addLoggedError(error: Error): AddLoggedErrorAction {
  return {
    type: ADD_LOGGED_ERROR,
    error,
    timestamp: Date.now(),
  };
}
