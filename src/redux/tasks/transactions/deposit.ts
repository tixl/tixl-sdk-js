import { AssetSymbol, Signature, fromBlockObject, Block, KeySet } from '@tixl/tixl-types';

import { ThunkDispatch, RootState } from '../..';
import { DepositChanges } from '../../../workflows/deposit';
import { getAccountChain } from '../../chains/selectors';
import { runOnWorker } from '../../../helpers/worker';
import { updateChain } from '../../chains/actions';
import { postTransaction } from '../../../requests/postTransaction';
import { getKeys } from '../../keys/selectors';
import { DepositTaskData } from '../actionTypes';
import { progressTask, waitNetwork } from '../actions';

export async function handleDepositTask(dispatch: ThunkDispatch, task: DepositTaskData) {
  console.log('deposit', { task });

  await dispatch(progressTask(task));

  const signatures = await dispatch(createDepositBlock(task.transactionHash, task.value, task.claimSignature));

  if (signatures) {
    dispatch(waitNetwork(task, signatures));
  }
}

export const createDepositBlock = (transactionHash: string, value: string, claimSignature?: string) => {
  return async (dispatch: ThunkDispatch, getState: () => RootState) => {
    const state = getState();
    const keys = getKeys(state);
    const accountChain = getAccountChain(state);
    const { signatureToChain } = state.chains;
    const loader = signatureToChain;

    let btcStealthChainId: string | null = null;
    for (let item of accountChain!.blocks) {
      const block = fromBlockObject(item);

      const decryptedBlock = await runOnWorker<Block>('decryptPayload', block, keys.aes);

      if (!decryptedBlock) continue;

      const { stealthchainId } = JSON.parse(decryptedBlock.payload);

      if (stealthchainId && stealthchainId.includes(AssetSymbol.BTC)) {
        btcStealthChainId = stealthchainId;
      }
    }

    if (btcStealthChainId) {
      const depositOp = await runOnWorker<DepositChanges>(
        'deposit',
        keys as KeySet,
        accountChain,
        value,
        transactionHash,
        AssetSymbol.BTC,
        btcStealthChainId as string,
        loader,
        claimSignature,
      );

      if (!depositOp) return;

      const updates = [];

      if (depositOp.accountChainOpen) {
        updates.push(depositOp.accountChainOpen);
      }

      if (depositOp.stealthChainOpen) {
        updates.push(depositOp.stealthChainOpen);
      }

      if (depositOp.stealthChainDeposit) {
        updates.push(depositOp.stealthChainDeposit);
      }

      dispatch(updateChain(depositOp.stealthChainDeposit.blockchain));

      await Promise.all(
        updates.map(async (update) => {
          await postTransaction(update.tx);
        }),
      );

      // collect new block signatures and wait for network result
      const signatures: Signature[] = [];
      updates.forEach((upd) => upd.tx.blocks.forEach((block) => signatures.push(block.signature)));

      return signatures;
    }
  };
};
