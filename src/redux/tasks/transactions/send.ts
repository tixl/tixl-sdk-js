import { AssetSymbol } from '@tixl/tixl-types';

import { ThunkDispatch, RootState } from '../..';
import { SendTaskData } from '../actionTypes';
import { progressTask, waitNetwork, signalSend, updateNonces } from '../actions';
import { getKeys } from '../../keys/selectors';
import { getAccountChain } from '../../chains/selectors';
import { runOnWorker } from '../../../helpers/worker';
import { postTransaction } from '../../../requests/postTransaction';
import { updateChain } from '../../chains/actions';
import { SendTx } from '../../../workflows/send';
import { setTxProofOfWork } from '../selectors';

export async function handleSendTask(dispatch: ThunkDispatch, task: SendTaskData) {
  console.log('send', { task });

  dispatch(progressTask(task));

  const signatures = await dispatch(createSendTransaction(task.address, task.amount, task.symbol, task.payload));

  if (signatures) {
    dispatch(waitNetwork(task, signatures));
  }
}

/**
 * @param address The public Tixl address of the receiver
 * @param amount The amount as a string. Always pass integer amounts as strings. 235 TXL or 1245789 Satoshis (no floats!)
 */
export function createSendTransaction(address: string, amount: string, symbol: AssetSymbol, payload?: string) {
  return async (dispatch: ThunkDispatch, getState: () => RootState) => {
    // for logging and debugging purposes
    dispatch(signalSend());

    const state = getState();
    const keys = getKeys(state);
    const accountChain = getAccountChain(state);

    if (!keys || !accountChain) return;

    // check if the user has enough funds to avoid sending a block to backend before
    // TODO add feature back if (JSBI.GT(amount, walletBalance)) return;

    const sendUpdate = await runOnWorker<SendTx | false>(
      'send',
      keys,
      accountChain,
      amount.toString(),
      address,
      symbol,
      payload,
    );

    if (!sendUpdate) return;

    setTxProofOfWork(state, sendUpdate.tx);

    await postTransaction(sendUpdate.tx);

    dispatch(updateNonces(sendUpdate.tx));
    dispatch(updateChain(sendUpdate.blockchain));

    // collect new block signatures to wait for network result
    return [sendUpdate.sendBlock.signature];
  };
}
