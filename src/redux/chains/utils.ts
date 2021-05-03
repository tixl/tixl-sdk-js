import { Block, Blockchain } from '@tixl/tixl-types';
import { BlockchainWithAdditionalInfo, BlockWithAdditionalInfo, BlockState } from './types';

export const mergeChains = (
  existingChain: BlockchainWithAdditionalInfo | null,
  blockchain: Blockchain,
  defaultBlockState: BlockState = 'pending',
): BlockchainWithAdditionalInfo => {
  if (!existingChain) {
    const newChain: BlockchainWithAdditionalInfo = Object.assign({}, blockchain) as BlockchainWithAdditionalInfo;

    newChain.blocks.forEach((_, index: number) => {
      newChain.blocks[index].state = defaultBlockState;
    });

    return newChain;
  }

  const newChain: BlockchainWithAdditionalInfo = Object.assign({}, blockchain) as BlockchainWithAdditionalInfo;

  newChain.blocks.forEach((block: Block, index: number) => {
    const indexOnExistingChain = existingChain.blocks.findIndex(
      (existingBlock: BlockWithAdditionalInfo) => existingBlock.signature === block.signature,
    );

    if (indexOnExistingChain >= 0) {
      const existingBlock = existingChain.blocks[indexOnExistingChain];

      if (existingBlock.state) {
        // copy the existing state over if there is one
        newChain.blocks[index].state = existingBlock.state;
      } else {
        // default state for existing blocks is accepted
        newChain.blocks[index].state = 'accepted';
      }
    } else {
      // new blocks are always pending
      newChain.blocks[index].state = defaultBlockState;
    }
  });

  // copy pending blocks
  existingChain.blocks.forEach((block: BlockWithAdditionalInfo) => {
    // dont add twice, if already handled
    if (newChain.blocks.find((newBlock) => newBlock.signature === block.signature)) return;

    if (block.state === 'pending') {
      newChain.blocks.push(block);
    }
  });

  return newChain;
};
