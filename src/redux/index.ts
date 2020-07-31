import { ThunkDispatch as ReduxThunkDispatch } from 'redux-thunk';
import { Action } from 'redux';
import { KeySet } from '@tixl/tixl-types';

import { TasksReduxState } from './tasks/reducer';
import { ChainsReduxState } from './chains/reducer';
import { LoggedError } from './errors/reducer';

export type RootState = {
  tasks: TasksReduxState;
  chains: ChainsReduxState;
  errors: LoggedError[];
  keys: KeySet;
};

export type ThunkDispatch = ReduxThunkDispatch<RootState, null, Action>;
