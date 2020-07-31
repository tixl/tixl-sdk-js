import { useDispatch, useSelector } from 'react-redux';

import { RootState, ThunkDispatch } from '../redux';
import { useInterval } from './useInterval';
import { InProgress } from '../redux/tasks/actionTypes';
import { skipTask } from '../redux/tasks/actions';
import { getKeys } from '../redux/keys/selectors';
import { handleReceiveTask } from '../redux/tasks/transactions/receive';
import { handleSendTask } from '../redux/tasks/transactions/send';
import { handleDepositTask } from '../redux/tasks/transactions/deposit';
import { handleWithdrawTask } from '../redux/tasks/transactions/withdraw';

async function handleOldInProgress(dispatch: ThunkDispatch, progressTask: InProgress) {
  // tasks in progress older than 30s will be skipped
  if (progressTask.createdAt <= new Date().getTime() - 30 * 1000) {
    dispatch(skipTask(progressTask.id));
  }
}

export function useTaskRunner() {
  console.info('task runner');

  const keySet = useSelector(getKeys);
  const dispatch = useDispatch();
  const state = useSelector((state: RootState) => state);
  const toSend = useSelector((state: RootState) => state.tasks.send);
  const toReceive = useSelector((state: RootState) => state.tasks.receive);
  const toDeposit = useSelector((state: RootState) => state.tasks.deposit);
  const toWithdraw = useSelector((state: RootState) => state.tasks.withdraw);
  const inProgress = useSelector((state: RootState) => state.tasks.inProgress);

  useInterval(() => {
    if (!keySet) return;

    // super basic logic to decide what to do next
    // if nothing in progress take first send task
    if (inProgress.length === 0 && toSend.length > 0) {
      return handleSendTask(dispatch, toSend[0]);
    }

    // then receive tasks
    if (inProgress.length === 0 && toReceive.length > 0) {
      return handleReceiveTask(dispatch, state, toReceive[0], keySet);
    }

    // then deposits
    if (inProgress.length === 0 && toDeposit.length > 0) {
      return handleDepositTask(dispatch, toDeposit[0]);
    }

    // then withdraws
    if (inProgress.length === 0 && toWithdraw.length > 0) {
      return handleWithdrawTask(dispatch, toWithdraw[0]);
    }

    // last: check on old tasks in progress to remove them
    if (inProgress.length > 0) {
      return handleOldInProgress(dispatch, inProgress[0]);
    }
  }, 1000);
}
