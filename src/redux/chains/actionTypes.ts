import { AssetSymbol, Signature } from '@tixl/tixl-types';

import { ResetAllDataAction } from '../global/actionTypes';
import {
  CREATE_ASSET_CHAIN,
  CREATE_ACCOUNT_CHAIN,
  FETCH_CHAIN_ERROR,
  UPDATE_BLOCK_STATE_ACCEPTED,
  UPDATE_BLOCK_STATE_REJECTED,
  UPDATE_CHAIN,
} from './actionKeys';
import { BlockchainWithAdditionalInfo } from './types';

export interface CreateAccountChainAction {
  type: typeof CREATE_ACCOUNT_CHAIN;
}

export interface UpdateChainAction {
  type: typeof UPDATE_CHAIN;
  chain: BlockchainWithAdditionalInfo;
}

export interface CreateAssetChainAction {
  type: typeof CREATE_ASSET_CHAIN;
  symbol: AssetSymbol;
}

export interface FetchChainErrorAction {
  type: typeof FETCH_CHAIN_ERROR;
}

export interface UpdateBlockAction {
  type: typeof UPDATE_BLOCK_STATE_ACCEPTED | typeof UPDATE_BLOCK_STATE_REJECTED;
  signature: Signature;
}

export type GeneralAction = CreateAssetChainAction | ResetAllDataAction | UpdateBlockAction | UpdateChainAction;
