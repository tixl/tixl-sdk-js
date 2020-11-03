import {
  GeneralAction,
  SendTaskData,
  ReceiveTaskData,
  NetworkApproval,
  InProgress,
  WithdrawTaskData,
  DepositTaskData,
} from './actionTypes';
import {
  CREATE_SEND_TASK,
  CREATE_RECEIVE_TASK,
  REMOVE_TASK,
  PROGRESS_TASK,
  WAIT_NETWORK,
  NETWORK_REJECTED_SIGNATURE,
  NETWORK_CONFIRMED_SIGNATURE,
  DONE_TASK,
  SKIP_TASK,
  CREATE_WITHDRAW_TASK,
  CREATE_DEPOSIT_TASK,
  ABORT_TASK,
} from './actionKeys';
import { RESET_ALL_DATA } from '../global/actionKeys';

export interface TasksReduxState {
  inProgress: InProgress[];
  networkApprovals: NetworkApproval[];
  send: SendTaskData[];
  receive: ReceiveTaskData[];
  withdraw: WithdrawTaskData[];
  deposit: DepositTaskData[];
}

const initialState: TasksReduxState = {
  inProgress: [],
  networkApprovals: [],
  send: [],
  receive: [],
  withdraw: [],
  deposit: [],
};

export function reducer(state = initialState, action: GeneralAction): TasksReduxState {
  switch (action.type) {
    // @ts-ignore for development
    case 'TASKS_RESET':
      return initialState;

    case ABORT_TASK:
    case DONE_TASK:
      return {
        ...state,
        networkApprovals: state.networkApprovals.filter((item) => item.id !== action.id),
        inProgress: state.inProgress.filter((item) => item.id !== action.id),
        send: state.send.filter((item) => item.id !== action.id),
        receive: state.receive.filter((item) => item.id !== action.id),
        deposit: state.deposit.filter((item) => item.id !== action.id),
        withdraw: state.withdraw.filter((item) => item.id !== action.id),
      };

    case NETWORK_REJECTED_SIGNATURE:
      const remainingAprovals = state.networkApprovals.map((net) => {
        if (net.signatures.indexOf(action.signature) === -1) return net;

        const update = {
          ...net,
          signatures: net.signatures.filter((sig) => sig !== action.signature),
          rejected: net.rejected.concat(action.signature),
        };

        return update;
      });

      return {
        ...state,
        networkApprovals: remainingAprovals,
      };

    case NETWORK_CONFIRMED_SIGNATURE:
      const remainingApprovals = state.networkApprovals.map((net) => {
        if (net.signatures.indexOf(action.signature) === -1) return net;

        const update = { ...net };
        update.signatures = update.signatures.filter((sig) => sig !== action.signature);

        return update;
      });

      return {
        ...state,
        networkApprovals: remainingApprovals,
      };

    case WAIT_NETWORK:
      return {
        ...state,
        networkApprovals: state.networkApprovals.concat({
          createdAt: new Date().getTime(),
          id: action.task.id,
          signatures: action.signatures,
          rejected: [],
        }),
      };

    case SKIP_TASK:
      return {
        ...state,
        inProgress: state.inProgress.filter((task) => task.id !== action.id),
        networkApprovals: state.networkApprovals.filter((task) => task.id !== action.id),
      };

    case PROGRESS_TASK:
      return {
        ...state,
        inProgress: state.inProgress.concat({
          createdAt: new Date().getTime(),
          id: action.task.id,
        }),
      };

    case REMOVE_TASK:
      return {
        ...state,
        send: state.send.filter((task) => task.id !== action.id),
        receive: state.receive.filter((task) => task.id !== action.id),
        inProgress: state.inProgress.filter((task) => task.id !== action.id),
        networkApprovals: state.networkApprovals.filter((task) => task.id !== action.id),
        deposit: state.deposit.filter((item) => item.id !== action.id),
        withdraw: state.withdraw.filter((item) => item.id !== action.id),
      };

    case CREATE_SEND_TASK:
      return {
        ...state,
        send: state.send.concat({
          ...action.task,
          id: Math.random().toString(),
          createdAt: new Date().getTime(),
        }),
      };

    case CREATE_RECEIVE_TASK:
      return {
        ...state,
        receive: state.receive.concat({
          ...action.task,
          id: Math.random().toString(),
          createdAt: new Date().getTime(),
        }),
      };

    case CREATE_WITHDRAW_TASK:
      return {
        ...state,
        withdraw: state.withdraw.concat({
          ...action.task,
          id: Math.random().toString(),
          createdAt: new Date().getTime(),
        }),
      };

    case CREATE_DEPOSIT_TASK:
      return {
        ...state,
        deposit: state.deposit.concat({
          ...action.task,
          id: Math.random().toString(),
          createdAt: new Date().getTime(),
        }),
      };

    case RESET_ALL_DATA:
      return initialState;

    default:
      return state;
  }
}
