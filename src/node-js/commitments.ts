import { commit, verifySum, rangeGetInfo } from '@tixl/tixl-pedersen-commitments';
import { BlockType, Signature, SigPublicKey } from '@tixl/tixl-types';

import { verifySignature as _verifySignature } from './signatures';

export function verifyRangeProof(proof: Buffer) {
  const infos = rangeGetInfo(proof);
  const isGreaterThanZero = BigInt(infos.min) >= 0n;

  // rangeproof info returns the maximum as a power of 2
  // using a proof of the maximum tixl amount will not exceed 2^63
  const isSmallerThanMaxSupply = BigInt(infos.max) < 2n ** 63n;

  return isGreaterThanZero && isSmallerThanMaxSupply;
}

/**
 * @param previousBlockCommitments  e.g. [blockG0.balanceCommitment]
 * @param nextBlockCommitments      e.g. [blockG1.balanceCommitment, blockG1.amountCommitment]
 */
export function verifyCommitments(previousBlockCommitments: Buffer[], nextBlockCommitments: Buffer[]) {
  if (
    !Array.isArray(previousBlockCommitments) ||
    !Array.isArray(nextBlockCommitments) ||
    previousBlockCommitments.length === 0 ||
    nextBlockCommitments.length === 0
  ) {
    return false;
  }

  return verifySum(previousBlockCommitments, nextBlockCommitments);
}

/**
 * @param commitment a commitment to prove that it equals 0
 * @returns true if it can be verified
 */
export function verifyZeroCommitment(commitment: Buffer, blindingFactor: Buffer): boolean {
  const zeroCommit = commit(blindingFactor, 0);

  return verifySum([commitment], [zeroCommit]);
}

export type VerifyCommitments = {
  type: BlockType;
  balanceCommitment: Buffer;
  amountCommitment: Buffer;
  blindingFactor?: Buffer;
};

export type RangeProofCommitments = {
  amountRangeProof: Buffer;
  balanceRangeProof: Buffer;
};

export function verifyBlockCommitments(
  previousBlock: VerifyCommitments | undefined,
  nextBlock: VerifyCommitments,
): boolean {
  // check first OPENING blocks against 0
  if (nextBlock.type === BlockType.OPENING && !previousBlock) {
    if (!nextBlock.blindingFactor) {
      return false;
    }

    return verifyZeroCommitment(nextBlock.balanceCommitment, nextBlock.blindingFactor);
  }

  if (!nextBlock || !previousBlock) return false;

  // verify other blocks against eachother
  let previousBlockCommitments: Buffer[] = [];
  let nextBlockCommitments: Buffer[] = [];

  if (nextBlock.type === BlockType.RECEIVE || nextBlock.type === BlockType.DEPOSIT) {
    previousBlockCommitments = [previousBlock.balanceCommitment, nextBlock.amountCommitment];
    nextBlockCommitments = [nextBlock.balanceCommitment];
  } else {
    previousBlockCommitments = [previousBlock.balanceCommitment];
    nextBlockCommitments = [nextBlock.amountCommitment, nextBlock.balanceCommitment];
  }

  return verifyCommitments(previousBlockCommitments, nextBlockCommitments);
}

export function verifyCommitmentsRangeProofs(nextBlock: RangeProofCommitments): boolean {
  const amountProof = verifyRangeProof(nextBlock.amountRangeProof);
  const balanceProof = verifyRangeProof(nextBlock.balanceRangeProof);
  return amountProof && balanceProof;
}

export function verifySignature(payload: Object, signature: Signature, publicKey: SigPublicKey) {
  return _verifySignature(JSON.stringify(payload), signature, publicKey);
}
