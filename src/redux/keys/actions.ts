import { Dispatch } from 'redux';
import { AESPrivateKey, Block, BlockType, KeySet, SigPublicKey } from '@tixl/tixl-types';

import { ThunkDispatch } from '..';
import { runOnWorker } from '../../helpers/worker';
import { GENERATE_KEYS, GENERATE_KEYS_SUCCESS, RESTORE_KEYS_SUCCESS } from './actionKeys';
import fetchBlockchain from '../../requests/getBlockchain';
import { updateChain } from '../chains/actions';

export const generateKeys = () => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: GENERATE_KEYS });

    const keySet = await runOnWorker<KeySet>('keySet');

    dispatch({
      type: GENERATE_KEYS_SUCCESS,
      keySet,
    });
  };
};

export const restoreKeys = (aes: AESPrivateKey, setError: (err: string) => void) => {
  return async (dispatch: ThunkDispatch) => {
    // restore public sig key to load account chain
    try {
      const publicSigKey = await runOnWorker<SigPublicKey>('getPublicSig', aes);

      if (!publicSigKey) return;
      console.log('restored public signature key', { publicSigKey });

      const accountChain = await fetchBlockchain(publicSigKey);

      if (!accountChain) {
        console.error('No accountchain found for private key');
        return;
      }

      // decrypt opening block and read full keyset
      const opening = { ...accountChain.openingBlock() } as Block;
      const decryptedOpening = await runOnWorker<Block>('decryptPayload', opening, aes);

      if (!decryptedOpening) return;

      const keySet = JSON.parse(decryptedOpening.payload);

      // decrypt opening blocks and refetch stealthchains
      await Promise.all(
        accountChain.blocks.map(async (block) => {
          if (block.type !== BlockType.OPENING || !block.prev) return;

          const blockCopy = { ...block } as Block;
          const decryptedBlock = await runOnWorker<Block>('decryptPayload', blockCopy, aes);

          if (!decryptedBlock) return;

          const stealtchChainKeys = JSON.parse(decryptedBlock.payload) as KeySet;
          const stealthChain = await fetchBlockchain(stealtchChainKeys.sig.publicKey);

          if (stealthChain) {
            dispatch(updateChain(stealthChain, 'accepted'));
          }
        }),
      );

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
