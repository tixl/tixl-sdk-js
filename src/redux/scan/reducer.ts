import { RESET_SCAN, SCAN_DATA_CHANGED } from './actionKeys';
import { GeneralAction } from './actionTypes';
import { RESET_ALL_DATA } from '../global/actionKeys';

export interface ScanData {
  lowestThreshold: number;
  earliestKnown: number;
  latestKnown: number;
}

export interface ScanReduxState {
  scanData: ScanData;
}

const initialState: ScanReduxState = {
  scanData: {
    lowestThreshold: 0,
    earliestKnown: Number.MAX_SAFE_INTEGER,
    latestKnown: 0,
  },
};

export function reducer(state = initialState, action: GeneralAction): ScanReduxState {
  switch (action.type) {
    case RESET_SCAN:
      return { ...state, scanData: initialState.scanData };
    case SCAN_DATA_CHANGED: {
      return {
        ...state,
        scanData: {
          lowestThreshold: action.lowestThreshold,
          earliestKnown: action.earliestKnown,
          latestKnown: action.latestKnown,
        },
      };
    }
    case RESET_ALL_DATA:
      return initialState;
    default:
      return state;
  }
}
