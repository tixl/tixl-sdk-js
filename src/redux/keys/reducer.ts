import { KeySet } from '@tixl/tixl-types';
import { GeneralAction } from './actionTypes';
import { GENERATE_KEYS_SUCCESS, RESTORE_KEYS_SUCCESS } from './actionKeys';

export type KeysReduxState = KeySet;

import { RESET_ALL_DATA } from '../global/actionKeys';

export function reducer(state: KeySet | null = null, action: GeneralAction) {
  switch (action.type) {
    case RESTORE_KEYS_SUCCESS:
      return action.keySet;
    case GENERATE_KEYS_SUCCESS:
      return action.keySet;
    case RESET_ALL_DATA:
      return null;
    default:
      return state;
  }
}
