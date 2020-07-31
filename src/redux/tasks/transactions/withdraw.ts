import { BlockchainTx, AssetSymbol, Signature } from '@tixl/tixl-types';

import { ThunkDispatch, RootState } from '../..';
import { signalWithdraw, progressTask, waitNetwork } from '../actions';
import { getAccountChain } from '../../chains/selectors';
import { runOnWorker } from '../../../helpers/worker';
import { updateChain } from '../../chains/actions';
import { postTransaction } from '../../../requests/postTransaction';
import { WithdrawTaskData } from '../actionTypes';

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
    const { signatureToChain } = state.chains;
    const loader = signatureToChain;

    const withdrawResult = await runOnWorker<BlockchainTx[]>(
      'withdraw',
      state.keys,
      accountChain,
      amount,
      btcAddress,
      AssetSymbol.BTC,
      loader,
    );

    if (!withdrawResult) return;

    if (withdrawResult.length > 0) {
      for (let singleWithdrawResult of withdrawResult) {
        dispatch(updateChain(singleWithdrawResult.blockchain));

        await postTransaction(singleWithdrawResult.tx);
      }
    }

    // collect new block signatures and wait for network result
    const signatures: Signature[] = [];
    withdrawResult.forEach((upd) => upd.tx.blocks.forEach((block) => signatures.push(block.signature)));

    return signatures;
  };
};
