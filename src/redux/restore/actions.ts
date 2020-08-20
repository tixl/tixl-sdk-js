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
        // decrypt opening block and read full keyset
        const opening = { ...accountChain.openingBlock() } as Block;
        const decryptedOpening = await runOnWorker<Block>('decryptPayload', opening, keys.aes);

        if (!decryptedOpening) return;

        const keySet = JSON.parse(decryptedOpening.payload);

        // decrypt opening blocks and refetch stealthchains
        await Promise.all(
          accountChain.blocks.map(async (block) => {
            if (block.type !== BlockType.OPENING || !block.prev) return;

            const blockCopy = { ...block } as Block;
            const decryptedBlock = await runOnWorker<Block>('decryptPayload', blockCopy, keys.aes);

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
      } else {
        throw new Error('Could neither find nor create account chain');
      }
    } catch (err) {
      setError(err.toString());
      console.error(err);
    }
  };
};
