import { AssetSymbol, Signature } from '@tixl/tixl-types';

import { ThunkDispatch, RootState } from '../..';
import { signalWithdraw, progressTask, waitNetwork, updateNonces } from '../actions';
import { getAccountChain } from '../../chains/selectors';
import { runOnWorker } from '../../../helpers/worker';
import { updateChain } from '../../chains/actions';
import { postTransaction } from '../../../requests/postTransaction';
import { WithdrawTaskData } from '../actionTypes';
import { WithdrawTx } from '../../../workflows/withdraw';
import { setTxProofOfWork } from '../selectors';

export async function handleWithdrawTask(dispatch: ThunkDispatch, task: WithdrawTaskData) {
  console.log('withdraw', { task });

  await dispatch(progressTask(task));

  const signatures = await dispatch(createWithdrawBlock(task.withdrawAmount, task.bitcoinAddress));

  if (signatures) {
    dispatch(waitNetwork(task, signatures));
  }
}

export const createWithdrawBlock = (amount: string, btcAddress: string) => {
  return async (dispatch: ThunkDispatch, getState: () => RootState) => {
    dispatch(signalWithdraw());

    const state = getState();
    const accountChain = getAccountChain(state);

    const withdrawResult = await runOnWorker<WithdrawTx | false>(
      'withdraw',
      state.keys,
      accountChain,
      amount,
      btcAddress,
      AssetSymbol.BTC,
    );

    if (!withdrawResult) return;

    setTxProofOfWork(state, withdrawResult.tx);

    await postTransaction(withdrawResult.tx);

    dispatch(updateNonces(withdrawResult.tx));
    dispatch(updateChain(withdrawResult.blockchain));

    // collect new block signatures and wait for network result
    return [withdrawResult.withdrawBlock.signature];
  };
};
