import { AssetSymbol, fromBlockchainObject } from '@tixl/tixl-types';
import flatMap from 'lodash/flatMap';

import { ThunkDispatch, RootState } from '../..';
import { signalWithdraw, progressTask, waitNetwork, updateNonces } from '../actions';
import { getAccountChain } from '../../chains/selectors';
import { runOnWorker } from '../../../helpers/worker';
import { updateChain } from '../../chains/actions';
import { mergePostTransactions } from '../../../requests/postTransaction';
import { WithdrawTaskData } from '../actionTypes';
import { WithdrawChanges } from '../../../workflows/withdraw';
import { setTxProofOfWork } from '../selectors';

export async function handleWithdrawTask(dispatch: ThunkDispatch, task: WithdrawTaskData, symbol: AssetSymbol) {
  console.log('withdraw', { task });

  await dispatch(progressTask(task));

  const signatures = await dispatch(
    createWithdrawTransaction(task.withdrawAmount, task.address, symbol, task.burnAmount),
  );

  if (signatures) {
    dispatch(waitNetwork(task, signatures));
  }
}

export function createWithdrawTransaction(amount: string, address: string, symbol: AssetSymbol, burnAmount?: string) {
  return async (dispatch: ThunkDispatch, getState: () => RootState) => {
    dispatch(signalWithdraw());

    const state = getState();

    const accountChain = fromBlockchainObject(getAccountChain(state));

    if (!accountChain) return;

    const withdrawData = await runOnWorker<WithdrawChanges | false>(
      'withdraw',
      state.keys,
      accountChain,
      amount,
      address,
      symbol,
      burnAmount,
    );

    if (!withdrawData) return;

    const updates = [];

    if (withdrawData.ethBurn) {
      updates.push(withdrawData.ethBurn);
    }

    if (withdrawData.assetWithdraw) {
      updates.push(withdrawData.assetWithdraw);
    }

    // write update to own state
    dispatch(updateChain(withdrawData.assetWithdraw.blockchain));

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

    // collect new block signatures and wait for network result
    const signatures = flatMap(updates, (update) => update.tx.blocks.map((block) => block.signature));

    return signatures;
  };
}
