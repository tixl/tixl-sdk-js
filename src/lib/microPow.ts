import sha256 from 'js-sha256';

export type HashPattern = { pos: number; character: string }[];

export function calculatePow(base: string, target: HashPattern, nonce: number = 1) {
  let hash = '';
  while (!matchesHashPattern(target, hash)) {
    nonce++;
    hash = sha256(base + String(nonce));
  }
  console.log(hash);
  return nonce;
}

export function calculateDoublePow(base: string, target1: HashPattern, target2: HashPattern) {
  return [calculatePow(base, target1), calculatePow(base, target2)];
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
