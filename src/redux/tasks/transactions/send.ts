import { AssetSymbol, Signature } from '@tixl/tixl-types';

import { ThunkDispatch, RootState } from '../..';
import { SendTaskData } from '../actionTypes';
import { progressTask, waitNetwork, signalSend } from '../actions';
import { getKeys } from '../../keys/selectors';
import { getAccountChain } from '../../chains/selectors';
import { runOnWorker } from '../../../helpers/worker';
import { postTransaction } from '../../../requests/postTransaction';
import { updateChain } from '../../chains/actions';
import { SendTx } from '../../../workflows/send';

export async function handleSendTask(dispatch: ThunkDispatch, task: SendTaskData) {
  console.log('send', { task });

  await dispatch(progressTask(task));

  const signatures = await dispatch(createSendTransaction(task.address, task.amount, task.symbol));

  if (signatures) {
    dispatch(waitNetwork(task, signatures));
  }
}

/**
 * @param address The public Tixl address of the receiver
 * @param amount The amount as a string. Always pass integer amounts as strings. 235 TXL or 1245789 Satoshis (no floats!)
 */
export function createSendTransaction(address: string, amount: string, symbol: AssetSymbol) {
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
    );

    if (!sendUpdate) return;

    try {
      await postTransaction(sendUpdate.tx);

      dispatch(updateChain(sendUpdate.blockchain));
    } catch (err) {
      console.error(err);
      return;
    }
    // TODO re-implement
    // const sendInvalid = shouldSendNextTxInvalid(state);
    // if (sendInvalid) {
    //   update.tx.blocks.forEach((block: Block) => {
    //     block.prev = 'invalid';
    //   });
    // await dispatch(sendNextTxInvalid(false));
    // }

    // TODO re implement modal via redux event
    // if (txResponse === GatewayErrors.RATE_LIMIT) {
    //   dispatch(showModal(ModalContentType.RATE_LIMIT_MODAL));
    //   throw new Error('Gateway rate limit');
    // }

    // collect new block signatures to wait for network result
    return [sendUpdate.sendBlock.signature];
  };
}
