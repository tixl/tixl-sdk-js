import { RESET_ALL_DATA, CLEAN_UP_STATE } from './actionKeys';

export interface ResetAllDataAction {
  type: typeof RESET_ALL_DATA;
  skip?: 'keyset';
}

export interface CleanUpStateAction {
  type: typeof CLEAN_UP_STATE;
}
