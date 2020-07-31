import { KeySet } from '@tixl/tixl-types';

import { RootState } from '..';

export const getKeys = (state: RootState): KeySet => state.keys;
