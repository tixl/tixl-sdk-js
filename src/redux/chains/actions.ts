import { AssetSymbol, Blockchain, Signature, fromBlockchainObject, Transaction, BlockchainTx } from '@tixl/tixl-types';
import flatMap from 'lodash/flatMap';

import { RootState, ThunkDispatch } from '..';
import { CreateAccountChainAction, UpdateBlockAction } from './actionTypes';
import {
  CREATE_ACCOUNT_CHAIN,
  UPDATE_BLOCK_STATE_REJECTED,
  UPDATE_BLOCK_STATE_ACCEPTED,
  UPDATE_CHAIN,
} from './actionKeys';
import { AppendStealthChainChanges } from '../../workflows/stealthchain';
import fetchBlockchain, { BlockchainNotFoundError, getBlockchain } from '../../requests/getBlockchain';
import { postTransaction } from '../../requests/postTransaction';
import { getAccountChain, getChain } from './selectors';
import { BlockState, BlockWithAdditionalInfo } from './types';
import { mergeChains } from './utils';
import { getKeys } from '../keys/selectors';
import { addLoggedError } from '../errors/actions';
import { runOnWorker } from '../../helpers/worker';
import { getBlock } from '../../requests/getBlock';
import { onNewNetworkResult } from '../tasks/actions';

// AccountChain related stuff
export function loadAccountChain() {
  return async (dispatch: ThunkDispatch, getState: () => RootState) => {
    const state = getState();
    const keys = getKeys(state);

    if (keys.sig.publicKey) {
      try {
        const chain = await fetchBlockchain(keys.sig.publicKey);
        return dispatch(updateChain(chain));
      } catch (err) {
        if (err instanceof BlockchainNotFoundError) {
          dispatch(addLoggedError(err));
        } else {
          // @todo - we must find a way to handle generic errors as well
          throw err;
        }
      }
    }
  };
}

const createAccountChainSignal = (): CreateAccountChainAction => ({
  type: CREATE_ACCOUNT_CHAIN,
});

export function createAccountChain() {
  return async (dispatch: ThunkDispatch, getState: () => RootState) => {
    dispatch(createAccountChainSignal());

    let accountChain: Blockchain | undefined;
    let accountChainTx: Transaction | undefined;
    const state = getState();

    try {
      accountChain = await getBlockchain(state.keys);
      dispatch(updateChain(accountChain));
    } catch (err) {
      if (err instanceof BlockchainNotFoundError) {
        const createAccountChainResult = await runOnWorker<BlockchainTx>('createAccountChain', state.keys);

        if (!createAccountChainResult) return;

        accountChainTx = createAccountChainResult.tx;
        accountChain = createAccountChainResult.blockchain;
        dispatch(updateChain(accountChain));

        if (accountChainTx) {
          await postTransaction(accountChainTx);
        }
      } else {
        throw err;
      }
    }
  };
}

export function updateChain(chain: Blockchain, defaultBlockState?: BlockState) {
  return async (dispatch: ThunkDispatch, getState: () => RootState) => {
    const state = getState();

    const existingChain = await getChain(state, chain.publicSig);

    dispatch({
      type: UPDATE_CHAIN,
      chain: mergeChains(existingChain, chain, defaultBlockState),
    });
  };
}

export function reloadIndexedChains() {
  return async (dispatch: ThunkDispatch, getState: () => RootState) => {
    console.info('reloading indexed chains');

    const state = getState();
    const sig2chains = state.chains.signatureToChain;
    const signatures = Object.getOwnPropertyNames(sig2chains);

    return signatures.map(async (publicSig) => {
      try {
        const chainObj = fromBlockchainObject(sig2chains[publicSig]);

        // cannot refetch a blockchain if the chain is too new (opening block pending)
        if (chainObj.openingBlock()?.state === 'pending') {
          return;
        }

        const chain = await fetchBlockchain(publicSig);
        dispatch(updateChain(chain));
      } catch (err) {
        if (err instanceof BlockchainNotFoundError) {
          dispatch(addLoggedError(err));
        } else {
          // @todo - we must find a way to handle generic errors as well
          throw err;
        }
      }
    });
  };
}

export function updateBlockState(signature: Signature, blockState: BlockState): UpdateBlockAction {
  return {
    type: blockState === 'accepted' ? UPDATE_BLOCK_STATE_ACCEPTED : UPDATE_BLOCK_STATE_REJECTED,
    signature,
  };
}

export function createAssetChain(symbol: AssetSymbol) {
  return async (dispatch: ThunkDispatch, getState: () => RootState) => {
    const state = getState();
    const keys = state.keys;
    const existingAccountChainObject = getAccountChain(state);
    const existingAccountChain = fromBlockchainObject(existingAccountChainObject);

    if (existingAccountChain && keys) {
      const id = `assetChain${symbol}`;
      const stealthChainOp = await runOnWorker<AppendStealthChainChanges>(
        'appendStealthChain',
        existingAccountChain,
        keys,
        id,
        symbol,
      );

      if (!stealthChainOp) return;

      const { accountchain: accountChainResult, stealthchain: stealthChainResult } = stealthChainOp;

      const mergedAccountChain = mergeChains(existingAccountChainObject, accountChainResult.blockchain);
      const mergedStealthChain = mergeChains(null, stealthChainResult.blockchain);

      dispatch(updateChain(mergedAccountChain));
      dispatch(updateChain(mergedStealthChain));

      // I'd suggest that we extract the following code into sagas because if the request dies or can not be executed
      // due to a bad internet connection that will result in a never synced opening block
      await postTransaction(stealthChainResult.tx);
      await postTransaction(accountChainResult.tx);
    }
  };
}

export function networkBlockState(block: BlockWithAdditionalInfo) {
  // update the block state from the network
  return async (dispatch: ThunkDispatch) => {
    // only check blocks that are pending
    if (block.state !== 'pending') return;

    // only check blocks that are at least 30s old
    if (block.createdAt >= new Date().getTime() - 30 * 1000) return;

    const fetchedBlock = await getBlock(block.signature, '');

    // block is known or unknown to the network
    if (!fetchedBlock) {
      dispatch(updateBlockState(block.signature, 'rejected'));
      dispatch(onNewNetworkResult(block.signature, 'rejected'));
    } else {
      dispatch(updateBlockState(block.signature, 'accepted'));
      dispatch(onNewNetworkResult(block.signature, 'accepted'));
    }
  };
}

export function updateBlockStatesNetwork() {
  // update all block states from the network
  return async (dispatch: ThunkDispatch, getState: () => RootState) => {
    const state = getState();
    const sig2chains = state.chains.signatureToChain;
    const signatures = Object.getOwnPropertyNames(sig2chains);
    const chains = signatures.map((sig) => sig2chains[sig]);
    const blocks = flatMap(chains, (chain) => chain.blocks);

    blocks.forEach((block) => {
      if (block.state === 'pending') {
        dispatch(networkBlockState(block));
      }
    });
  };
}
