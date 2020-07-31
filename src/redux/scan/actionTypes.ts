import { RESET_SCAN, SCAN_DATA_CHANGED } from './actionKeys';
import { ResetAllDataAction } from '../global/actionTypes';

export interface ScanDataChangedAction {
  type: typeof SCAN_DATA_CHANGED;
  lowestThreshold: number;
  earliestKnown: number;
  latestKnown: number;
}

export interface ResetScanAction {
  type: typeof RESET_SCAN;
}

export type GeneralAction = ScanDataChangedAction | ResetScanAction | ResetAllDataAction;
