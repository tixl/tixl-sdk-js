import { KeySet, Blockchain } from '@tixl/tixl-types';

import { ResetAllDataAction } from '../global/actionTypes';
import { GENERATE_KEYS, GENERATE_KEYS_SUCCESS, RESTORE_KEYS_SUCCESS } from './actionKeys';

export interface GenerateKeysAction {
  type: typeof GENERATE_KEYS;
}

export interface GenerateKeysSuccessAction {
  type: typeof GENERATE_KEYS_SUCCESS;
  keySet: KeySet;
}

export interface RestoreKeysSuccessAction {
  type: typeof RESTORE_KEYS_SUCCESS;
  keySet: KeySet;
  accountChain: Blockchain;
}

export type GeneralAction =
  | GenerateKeysAction
  | GenerateKeysSuccessAction
  | ResetAllDataAction
  | RestoreKeysSuccessAction;
