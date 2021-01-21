import { Transaction } from '@tixl/tixl-types';
import { sha256 } from 'js-sha256';

export type HashPattern = { pos: number; character: string }[];

const powTarget = [
  { pos: 0, character: '0' },
  { pos: 1, character: '0' },
  { pos: 2, character: '0' },
  { pos: 3, character: '0' },
];

const powTargetAlt = [
  { pos: 0, character: '1' },
  { pos: 1, character: '1' },
  { pos: 2, character: '1' },
  { pos: 3, character: '1' },
];

function calculatePow(base: string, target: HashPattern, nonce: number = 1) {
  let hash = '';

  while (!matchesHashPattern(target, hash)) {
    nonce++;
    hash = sha256(base + String(nonce));
  }

  return nonce;
}

export function calculateDoublePow(base: string) {
  return [calculatePow(base, powTarget), calculatePow(base, powTargetAlt)];
}

export function checkPow(base: string, target: HashPattern, nonce: number) {
  const hash = sha256(base + String(nonce));
  return matchesHashPattern(target, hash);
}

function matchesHashPattern(target: HashPattern, x: string) {
  for (const { pos, character } of target) {
    if (x[pos] !== character) return false;
  }
  return true;
}

// Calculate and set nonces on each block of the transaction
export function setTxBlockNonces(tx: Transaction) {
  tx.blocks.forEach((block) => {
    block.nonce = calculateDoublePow((block.prev || block.signature) as string);
  });
}
