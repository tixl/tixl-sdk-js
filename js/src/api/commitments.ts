import { Block, Crypto, CommitmentData, BlockValues, BlockCommitments, BlockType } from '@tixl/tixl-types';

type ModeAdd = 1;
type ModeSubtract = 2;

export function setCommitments(
  crypto: Crypto,
  commitmentData: CommitmentData,
  block: Block,
  prev?: Block,
  ref?: Block,
) {
  const commits = createCommitments(
    crypto,
    commitmentData,
    prev ? crypto.base64.toBytes(prev.senderBlindingFactorBalance) : undefined,
    ref && block.type === BlockType.RECEIVE ? crypto.base64.toBytes(ref.receiverBlindingFactorAmount) : undefined,
    block.type,
  );

  block.amountCommitment =
    ref && block.type === BlockType.RECEIVE ? ref.amountCommitment : crypto.base64.toString(commits.amountCommitment);
  block.balanceCommitment = crypto.base64.toString(commits.balanceCommitment);
  block.senderBlindingFactorBalance = crypto.base64.toString(commits.balanceCommitmentBlindFactor);
  block.amountRangeProof = crypto.base64.toString(commits.amountRangeProof);
  block.balanceRangeProof = crypto.base64.toString(commits.balanceRangeProof);

  if (block.type === BlockType.SEND) {
    block.receiverBlindingFactorAmount = crypto.base64.toString(commits.amountCommitmentBlindFactor);
  }
}

export function createCommitments(
  crypto: Crypto,
  nextBlock: BlockValues,
  previousBlindFactor?: any,
  blindFactor?: any,
  type?: string,
) {
  const bf = blindFactor || crypto.randomBytes(32);

  return createCommitmentsSeeded(
    crypto,
    nextBlock,
    bf,
    type === BlockType.RECEIVE || type === BlockType.DEPOSIT ? 2 : 1,
    previousBlindFactor,
  );
}

export function createCommitmentsSeeded(
  crypto: Crypto,
  nextBlock: BlockValues,
  blindFactor: any,
  mode: ModeAdd | ModeSubtract = 1,
  previousBlindFactor?: any,
): BlockCommitments {
  const amountCommitmentBlindFactor = blindFactor;
  const amountCommitment = crypto.secp256k1.commit(amountCommitmentBlindFactor, nextBlock.amount.toString());
  const balanceCommitmentBlindFactor = previousBlindFactor
    ? crypto.secp256k1.blindSum([previousBlindFactor, amountCommitmentBlindFactor], mode)
    : amountCommitmentBlindFactor;
  const balanceCommitment = crypto.secp256k1.commit(balanceCommitmentBlindFactor, nextBlock.balance.toString());

  // rangeProofSign(minValue = 0, commitment, commitBlind, nonce, base10Exp = 0, minBits = 0, actualValue)
  const amountRangeProof = crypto.secp256k1.rangeProofSign(
    0,
    amountCommitment,
    blindFactor,
    blindFactor,
    0,
    0,
    nextBlock.amount.toString(),
  );
  const balanceRangeProof = crypto.secp256k1.rangeProofSign(
    0,
    balanceCommitment,
    balanceCommitmentBlindFactor,
    blindFactor,
    0,
    0,
    nextBlock.balance.toString(),
  );

  return {
    amountCommitmentBlindFactor,
    amountCommitment,
    amountRangeProof,
    balanceCommitmentBlindFactor,
    balanceCommitment,
    balanceRangeProof,
  };
}
