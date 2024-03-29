import { Block, Signature, Transaction } from '@tixl/tixl-types';

import { RootState } from '..';
import { calculateDoublePow } from '../../lib/microPow';
import { TaskData } from './actionTypes';

export function setTxProofOfWork(state: RootState, tx: Transaction) {
  tx.blocks = tx.blocks.map((block) => {
    const nonce = getBlockNonce(state, block);

    return { ...block, nonce } as Block;
  });
}

export function getBlockNonce(state: RootState, block: Block): number[] | undefined {
  // fallback to signature for blocks without prev, like accountchain open blocks
  if (!block.prev) return calculateDoublePow(block.signature as string);

  // lookup pre calculated nonces
  if (state.tasks.nonces[block.prev as string]) return state.tasks.nonces[block.prev as string];

  // last resort to calc new nonce
  return calculateDoublePow(block.prev as string);
}

// returns true if a send task has blocks that are waiting for network approval
export function sendBlockWaitingForNetwork(state: RootState): boolean {
  const send = state.tasks.send;
  const networkApprovals = state.tasks.networkApprovals;

  if (send.length === 0 || networkApprovals.length === 0) return false;

  const sendIndex = send.findIndex((task) => networkApprovals.findIndex((net) => net.id === task.id) !== -1);

  return sendIndex !== -1;
}

// return true if there is a receive task for the send block signature
export function receiveTaskExists(state: RootState, sendSignature: Signature): boolean {
  const receive = state.tasks.receive;

  if (receive.length === 0) return false;

  const receiveIndex = receive.findIndex((task) => task.sendSignature === sendSignature);

  return receiveIndex !== -1;
}

// return true if there is already a send task
export function sendTaskExist(state: RootState, address: string, amount: string) {
  const send = state.tasks.send;

  if (send.length === 0) return false;

  const receiveIndex = send.findIndex((task) => task.address === address && task.amount === amount);

  return receiveIndex !== -1;
}

// return true if there is already a withdraw task
export function withdrawTaskExist(state: RootState, address: string, amount: string) {
  const withdraw = state.tasks.withdraw;

  if (withdraw.length === 0) return false;

  const receiveIndex = withdraw.findIndex((task) => task.address === address && task.withdrawAmount === amount);

  return receiveIndex !== -1;
}

export function depositTaskExists(state: RootState, transactionHash: string): boolean {
  return state.tasks.deposit.find((task) => task.transactionHash === transactionHash) !== undefined;
}

export function depositTask(state: RootState, transactionHash: string): TaskData | undefined {
  return state.tasks.deposit.find((task) => task.transactionHash === transactionHash);
}
