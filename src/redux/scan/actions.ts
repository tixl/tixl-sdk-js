import { ResetScanAction, ScanDataChangedAction } from './actionTypes';
import { RESET_SCAN, SCAN_DATA_CHANGED } from './actionKeys';

export function resetScan(): ResetScanAction {
  return {
    type: RESET_SCAN,
  };
}

export function scanDataChanged(
  lowestThreshold: number,
  earliestKnown: number,
  latestKnown: number,
): ScanDataChangedAction {
  return {
    type: SCAN_DATA_CHANGED,
    lowestThreshold,
    earliestKnown,
    latestKnown,
  };
}
