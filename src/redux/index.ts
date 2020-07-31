import { ThunkDispatch as ReduxThunkDispatch } from 'redux-thunk';
import { Action } from 'redux';

import { TasksReduxState } from './tasks/reducer';
import { ChainsReduxState } from './chains/reducer';
import { ErrorsReduxState } from './errors/reducer';
import { KeysReduxState } from './keys/reducer';
import { DebugReduxState } from './debug/reducer';

export type RootState = {
  tasks: TasksReduxState;
  chains: ChainsReduxState;
  errors: ErrorsReduxState;
  keys: KeysReduxState;
  debug: DebugReduxState;
};

export type ThunkDispatch = ReduxThunkDispatch<RootState, null, Action>;
