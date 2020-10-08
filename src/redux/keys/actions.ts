import { Dispatch } from 'redux';
import { KeySet, SigPrivateKey, SigPublicKey } from '@tixl/tixl-types';

import { ThunkDispatch, RootState } from '..';
import { runOnWorker } from '../../helpers/worker';
import { GENERATE_KEYS, GENERATE_KEYS_SUCCESS, RESTORE_KEYS_SUCCESS } from './actionKeys';
import { updateChain } from '../chains/actions';
import { getKeys } from './selectors';
import fetchBlockchain from '../../requests/getBlockchain';

export const generateKeys = (mnemonicSeed?: Uint8Array) => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: GENERATE_KEYS });

    const keySet = mnemonicSeed
      ? await runOnWorker<KeySet>('keySetSeeded', mnemonicSeed)
      : await runOnWorker<KeySet>('keySet');

    dispatch({
      type: GENERATE_KEYS_SUCCESS,
      keySet,
    });
  };
};

export const restoreKeysFromState = (setError: (err: string) => void) => {
  return async (dispatch: ThunkDispatch, getState: () => RootState) => {
    const state = getState();
    const keys = getKeys(state);

    return dispatch(restoreKeys(keys.sig.privateKey, setError));
  };
};

export const restoreKeys = (sigPk: SigPrivateKey, setError: (err: string) => void) => {
  return async (dispatch: ThunkDispatch) => {
    // restore public sig key to load account chain
    try {
      const publicSigKey = await runOnWorker<SigPublicKey>('getPublicSig', sigPk);

      if (!publicSigKey) return;
      console.log('restored public signature key', { publicSigKey });

      const accountChain = await fetchBlockchain(publicSigKey);

      if (!accountChain) {
        console.error('No accountchain found for private key');
        return;
      }

      const keySet: KeySet = {
        sig: {
          privateKey: sigPk,
          publicKey: publicSigKey,
        },
      };

      dispatch({
        type: RESTORE_KEYS_SUCCESS,
        keySet,
        accountChain,
      });

      dispatch(updateChain(accountChain, 'accepted'));
    } catch (err) {
      setError(err.toString());
      console.error(err);
    }
  };
};
