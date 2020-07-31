import { Signature } from '@tixl/tixl-types';

import { RootState } from '..';

// returns true if a send task has blocks that are waiting for network approval
export function sendBlockWaitingForNetwork(state: RootState): boolean {
  const send = state.tasks.send;
  const networkApprovals = state.tasks.networkApprovals;

  if (send.length === 0 || networkApprovals.length === 0) return false;

  const sendIndex = send.findIndex((task) => networkApprovals.findIndex((net) => net.id === task.id) !== -1);

  return sendIndex !== -1;
}

// return true if there is a receive task for the send block signature
export function sendBlockTask(state: RootState, sendSignature: Signature): boolean {
  const receive = state.tasks.receive;

  if (receive.length === 0) return false;

  const receiveIndex = receive.findIndex((task) => task.sendSignature === sendSignature);

  return receiveIndex !== -1;
}
