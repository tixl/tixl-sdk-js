import { AssetSymbol, Signature, KeySet } from '@tixl/tixl-types';
import flatMap from 'lodash/flatMap';

import { ThunkDispatch, RootState } from '../..';
import { DepositChanges } from '../../../workflows/deposit';
import { getAccountChain } from '../../chains/selectors';
import { runOnWorker } from '../../../helpers/worker';
import { updateChain } from '../../chains/actions';
import { mergePostTransactions } from '../../../requests/postTransaction';
import { getKeys } from '../../keys/selectors';
import { DepositTaskData } from '../actionTypes';
import { progressTask, updateNonces, waitNetwork } from '../actions';
import { setTxProofOfWork } from '../selectors';

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

    const depositOp = await runOnWorker<DepositChanges>(
      'deposit',
      keys as KeySet,
      accountChain,
      value,
      transactionHash,
      AssetSymbol.BTC,
      claimSignature,
    );

    if (!depositOp) return;

    const updates = [];

    if (depositOp.accountchainAsset) {
      updates.push(depositOp.accountchainAsset);
    }

    if (depositOp.assetDeposit) {
      updates.push(depositOp.assetDeposit);
    }

    dispatch(updateChain(depositOp.assetDeposit.blockchain));

    // proof of work
    updates.forEach((update) => {
      setTxProofOfWork(state, update.tx);
    });

    const txs = updates.map((update) => update.tx);

    // build one tx and send to gateway
    await mergePostTransactions(txs);

    //  precalc pow
    await Promise.all(
      updates.map(async (update) => {
        await dispatch(updateNonces(update.tx));
      }),
    );

    // collect new block signatures to wait for network result
    const signatures = flatMap(updates, (update) => update.tx.blocks.map((block) => block.signature));

    return signatures;
  };
};
