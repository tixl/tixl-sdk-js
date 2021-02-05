import { AssetSymbol, Signature } from '@tixl/tixl-types';

import {
  CREATE_RECEIVE_TASK,
  CREATE_SEND_TASK,
  REMOVE_TASK,
  PROGRESS_TASK,
  WAIT_NETWORK,
  NETWORK_CONFIRMED_SIGNATURE,
  NETWORK_REJECTED_SIGNATURE,
  DONE_TASK,
  SKIP_TASK,
  CREATE_RECEIVE_TRANSACTION,
  CREATE_SEND_TRANSACTION,
  CREATE_WITHDRAW_TRANSACTION,
  CREATE_DEPOSIT_TRANSACTION,
  CREATE_WITHDRAW_TASK,
  CREATE_DEPOSIT_TASK,
  ABORT_TASK,
  UPDATE_NONCES,
} from './actionKeys';
import { ResetAllDataAction } from '../global/actionTypes';

export type InProgress = {
  id: string;
  createdAt: number;
  skipCounter: number;
};

export type NetworkApproval = {
  id: string;
  rejected: Signature[];
  signatures: Signature[];
  createdAt: number;
};

export type TaskData = {
  id: string;
  createdAt: number;
  skipCounter: number;
};

export type SendTaskData = TaskData & {
  amount: string;
  address: string;
  symbol: AssetSymbol;
  payload?: string;
};

export type ReceiveTaskData = TaskData & {
  sendSignature: Signature;
  sendHash?: string;
  symbol?: AssetSymbol;
};

export type WithdrawTaskData = TaskData & {
  withdrawAmount: string;
  address: string;
  symbol: AssetSymbol;
};

export type DepositTaskData = TaskData & {
  transactionHash: string;
  value: string;
  symbol: AssetSymbol;
  claimSignature?: string;
};

export interface CreateReceiveTransactionAction {
  type: typeof CREATE_RECEIVE_TRANSACTION;
}

export interface CreateSendTransactionAction {
  type: typeof CREATE_SEND_TRANSACTION;
}

export interface CreateWithdrawTransactionAction {
  type: typeof CREATE_WITHDRAW_TRANSACTION;
}

export interface CreateDepositTransactionAction {
  type: typeof CREATE_DEPOSIT_TRANSACTION;
}

export interface DoneTaskAction {
  type: typeof DONE_TASK;
  id: string;
}

export interface AbortTaskAction {
  type: typeof ABORT_TASK;
  id: string;
}

export interface SkipTaskAction {
  type: typeof SKIP_TASK;
  id: string;
}

export interface WaitNetworkAction {
  type: typeof WAIT_NETWORK;
  signatures: Signature[];
  task: TaskData;
}

export interface NetworkConfirmedSignatureAction {
  type: typeof NETWORK_CONFIRMED_SIGNATURE;
  signature: Signature;
}

export interface NetworkRejectedSignatureAction {
  type: typeof NETWORK_REJECTED_SIGNATURE;
  signature: Signature;
}

export interface CreateSendTaskAction {
  type: typeof CREATE_SEND_TASK;
  task: SendTaskData;
}

export interface CreateReceiveTaskAction {
  type: typeof CREATE_RECEIVE_TASK;
  task: ReceiveTaskData;
}

export interface CreateReceiveTaskAction {
  type: typeof CREATE_RECEIVE_TASK;
  task: ReceiveTaskData;
}

export interface CreateWithdrawTaskAction {
  type: typeof CREATE_WITHDRAW_TASK;
  task: WithdrawTaskData;
}

export interface CreateDepositTaskAction {
  type: typeof CREATE_DEPOSIT_TASK;
  task: DepositTaskData;
}

export interface RemoveTaskAction {
  type: typeof REMOVE_TASK;
  id: string;
}

export interface ProgressTaskAction {
  type: typeof PROGRESS_TASK;
  task: SendTaskData | ReceiveTaskData | DepositTaskData | WithdrawTaskData;
}

export interface UpdateNoncesAction {
  type: typeof UPDATE_NONCES;
  nonces: Record<string, number[]>;
}

export type GeneralAction =
  | UpdateNoncesAction
  | CreateReceiveTaskAction
  | CreateSendTaskAction
  | CreateWithdrawTaskAction
  | CreateDepositTaskAction
  | RemoveTaskAction
  | DoneTaskAction
  | AbortTaskAction
  | SkipTaskAction
  | ProgressTaskAction
  | WaitNetworkAction
  | NetworkConfirmedSignatureAction
  | NetworkRejectedSignatureAction
  | ResetAllDataAction;
