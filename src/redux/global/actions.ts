import { ResetAllDataAction } from './actionTypes';
import { RESET_ALL_DATA } from './actionKeys';

export function resetAllData(): ResetAllDataAction {
  return {
    type: RESET_ALL_DATA,
  };
}
