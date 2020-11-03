import { Block, BlockType, fromBlockchainObject, KeySet } from '@tixl/tixl-types';

import { ThunkDispatch, RootState } from '..';
import { runOnWorker } from '../../helpers/worker';
import fetchBlockchain, { BlockchainNotFoundError } from '../../requests/getBlockchain';
import { createAccountChain, updateChain } from '../chains/actions';
import { RESTORE_KEYS_SUCCESS } from '../keys/actionKeys';
import { generateKeys } from '../keys/actions';
import { getKeys } from '../keys/selectors';
import { getAccountChain } from '../chains/selectors';

export const restoreOrSetup = (mnemonicSeed: Uint8Array, setError: (err: string) => void) => {
  return async (dispatch: ThunkDispatch, getState: () => RootState) => {
    try {
      await dispatch(generateKeys(mnemonicSeed));
      const keys = await getKeys(getState());
      const publicSigKey = keys.sig.publicKey;

      if (!publicSigKey) {
        const msg = 'Signature key could not be created.';
        console.error(msg);
        setError(msg);
        return;
      }

      let accountChain;
      try {
        accountChain = await fetchBlockchain(publicSigKey);
      } catch (err) {
        if (err.name !== BlockchainNotFoundError.errorName) {
          throw err;
        }
      }

      if (!accountChain) {
        await dispatch(createAccountChain());
        accountChain = fromBlockchainObject(getAccountChain(getState()));
      }

      if (accountChain) {
        const keySet: KeySet = {
          sig: keys.sig,
        };

        dispatch({
          type: RESTORE_KEYS_SUCCESS,
          keySet,
          accountChain,
        });

        dispatch(updateChain(accountChain, 'accepted'));
      } else {
        throw new Error('Could neither find nor create account chain');
      }
    } catch (err) {
      setError(err.toString());
      console.error(err);
    }
  };
};
