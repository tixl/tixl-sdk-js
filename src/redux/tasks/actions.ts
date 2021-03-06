import { AssetSymbol, Signature, Transaction } from '@tixl/tixl-types';

import {
  CREATE_SEND_TASK,
  PROGRESS_TASK,
  WAIT_NETWORK,
  NETWORK_CONFIRMED_SIGNATURE,
  NETWORK_REJECTED_SIGNATURE,
  DONE_TASK,
  ABORT_TASK,
  CREATE_RECEIVE_TASK,
  SKIP_TASK,
  CREATE_RECEIVE_TRANSACTION,
  CREATE_SEND_TRANSACTION,
  CREATE_DEPOSIT_TRANSACTION,
  CREATE_WITHDRAW_TRANSACTION,
  CREATE_DEPOSIT_TASK,
  CREATE_WITHDRAW_TASK,
  UPDATE_NONCES,
} from './actionKeys';
import { TaskData } from './actionTypes';

import { sendBlockTask } from './selectors';
import { TasksReduxState } from './reducer';
import { ThunkDispatch, RootState } from '..';
import { calculateDoublePow } from '../../lib/microPow';

export function updateNonces(tx: Transaction) {
  const nonces: Record<string, number[]> = {};

  tx.blocks.forEach((block) => {
    const nonce = calculateDoublePow(block.signature as string);

    // the next (new) transaction can lookup the POW for a block with its prev signature
    nonces[block.signature as string] = nonce;
  });

  return {
    type: UPDATE_NONCES,
    nonces,
  };
}

export function createReceiveTask(sendSignature: Signature, sendHash?: string, symbol?: AssetSymbol) {
  return async (dispatch: ThunkDispatch, getState: () => RootState) => {
    // check that there is not already a receive task for the send block
    if (sendBlockTask(getState(), sendSignature)) {
      console.log('skip task creation: duplicate task');
      return;
    }

    dispatch({
      type: CREATE_RECEIVE_TASK,
      task: {
        sendSignature,
        sendHash,
        symbol,
      },
    });
  };
}

export function createSendTask(amount: string, address: string, symbol: AssetSymbol, payload?: string) {
  return {
    type: CREATE_SEND_TASK,
    task: {
      amount,
      address,
      symbol,
      payload,
    },
  };
}

export function createDepositTask(
  transactionHash: string,
  value: string,
  symbol: AssetSymbol,
  claimSignature?: string,
) {
  return {
    type: CREATE_DEPOSIT_TASK,
    task: {
      transactionHash,
      value,
      symbol,
      claimSignature,
    },
  };
}

export function createWithdrawTask(withdrawAmount: string, symbol: AssetSymbol, address: string) {
  return {
    type: CREATE_WITHDRAW_TASK,
    task: {
      withdrawAmount,
      address,
      symbol,
    },
  };
}

// mark a task as the currently running task
export function progressTask(task: TaskData) {
  return {
    type: PROGRESS_TASK,
    task,
  };
}

// mark this task as not in progress anymore, can be retried
export function skipTask(id: string) {
  return {
    type: SKIP_TASK,
    id,
  };
}

// a task is removed and should not be retried, because of an error
export function abortTask(id: string) {
  return {
    type: ABORT_TASK,
    id,
  };
}

// the task is removed because it is done (happy path)
export function doneTask(id: string) {
  return {
    type: DONE_TASK,
    id,
  };
}

export function waitNetwork(task: TaskData, signatures: Signature[]) {
  return {
    type: WAIT_NETWORK,
    signatures,
    task,
  };
}

export function onNewNetworkResult(signature: Signature, state: 'accepted' | 'rejected') {
  return async (dispatch: ThunkDispatch, getState: () => { tasks: TasksReduxState }) => {
    const waitingApprovals = getState().tasks.networkApprovals;

    waitingApprovals.forEach((net) => {
      if (net.signatures.includes(signature)) {
        // found approval list

        if (state === 'rejected') {
          dispatch(networkRejectedSignature(signature));
          dispatch(abortTask(net.id));
          return;
        }

        if (state === 'accepted') {
          dispatch(networkConfirmedSignature(signature));

          if (net.signatures.length === 1 && net.rejected.length === 0) {
            // last block and none rejected => task is done
            dispatch(doneTask(net.id));
          }

          return;
        }

        console.error('unsure on network result', { signature, state });
      }
    });
  };
}

export function networkRejectedSignature(signature: Signature) {
  return {
    type: NETWORK_REJECTED_SIGNATURE,
    signature,
  };
}

export function networkConfirmedSignature(signature: Signature) {
  return {
    type: NETWORK_CONFIRMED_SIGNATURE,
    signature,
  };
}

export function signalReceive() {
  return {
    type: CREATE_RECEIVE_TRANSACTION,
  };
}

export function signalSend() {
  return {
    type: CREATE_SEND_TRANSACTION,
  };
}

export function signalWithdraw() {
  return {
    type: CREATE_WITHDRAW_TRANSACTION,
  };
}

export function signalDeposit() {
  return {
    type: CREATE_DEPOSIT_TRANSACTION,
  };
}
