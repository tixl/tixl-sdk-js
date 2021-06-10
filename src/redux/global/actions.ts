import { CleanUpStateAction, ResetAllDataAction } from './actionTypes';
import { CLEAN_UP_STATE, RESET_ALL_DATA } from './actionKeys';

import { ThunkDispatch, RootState } from '..';
import { acceptedDepositBlocks } from '../chains/selectors';
import { depositTask } from '../tasks/selectors';
import { doneTask } from '../tasks/actions';

// Reset redux state to defaults.
// Can skip certain modules.
export function resetAllData(skip?: 'keyset'): ResetAllDataAction {
  return {
    type: RESET_ALL_DATA,
    skip,
  };
}

export function cleanUpState() {
  return async (dispatch: ThunkDispatch, getState: () => RootState) => {
    dispatch({
      type: CLEAN_UP_STATE,
    });

    // remove deposit tasks if accepted block has the hash
    const depositBlocks = acceptedDepositBlocks(getState());

    for (const block of depositBlocks) {
      if (block.refAsset) {
        const task = depositTask(getState(), block.refAsset);

        if (task) {
          dispatch(doneTask(task.id));
        }
      }
    }
  };
}
