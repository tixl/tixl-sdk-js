import { AssetSymbol, Block, Blockchain, SigPublicKey, Signature } from '@tixl/tixl-types';

import { RootState } from '..';
import { getKeys } from '../keys/selectors';
import { BlockchainWithAdditionalInfo, BlockWithAdditionalInfo, BlockState } from './types';

export const getAllBlocks = (state: RootState): BlockWithAdditionalInfo[] => {
  const allBlocks: BlockWithAdditionalInfo[] = [];

  Object.values(state.chains.signatureToChain).forEach((chain: BlockchainWithAdditionalInfo) => {
    chain.blocks.forEach((block: BlockWithAdditionalInfo) => {
      allBlocks.push(block);
    });
  });

  return allBlocks;
};

export const getAllChains = (state: RootState): BlockchainWithAdditionalInfo[] => {
  return Object.values(state.chains.signatureToChain);
};

export const getRejectedChains = (state: RootState) => {
  return Object.values(state.chains.rejectedBlocks);
};

export const getAccountChain = (state: RootState): BlockchainWithAdditionalInfo | null => {
  const keys = getKeys(state);

  if (!keys) {
    return null;
  }

  return state.chains.signatureToChain[keys.sig.publicKey as string] || null;
};

export const getChain = (state: RootState, publicSig: SigPublicKey): BlockchainWithAdditionalInfo | null => {
  return state.chains.signatureToChain[publicSig as string] || null;
};

export const getFirstChainBySymbol = (
  state: RootState,
  symbol: AssetSymbol = AssetSymbol.TXL,
): Blockchain | undefined => {
  const keys = Object.keys(state.chains.signatureToChain);

  let assetChain: Blockchain | undefined;

  keys.forEach((key) => {
    if (!assetChain) {
      const blockchain: Blockchain = state.chains.signatureToChain[key];

      if (blockchain.assetSymbol === symbol) {
        assetChain = blockchain;
      }
    }
  });

  return assetChain;
};

export const getDepositBlock = (state: RootState, btcTransactionHash: string): Block | null => {
  let depositBlock = null;
  const chainKeys = Object.keys(state.chains.signatureToChain);

  chainKeys.forEach((key) => {
    const blockchain = state.chains.signatureToChain[key];

    blockchain.blocks.forEach((block: Block) => {
      if (block.refAsset === btcTransactionHash) {
        depositBlock = block;
      }
    });
  });

  return depositBlock;
};

export const getReceiveBlock = (state: RootState, sendSignature: Signature): Block | null => {
  let receiveBlock = null;
  const chainKeys = Object.keys(state.chains.signatureToChain);

  chainKeys.forEach((key) => {
    const blockchain = state.chains.signatureToChain[key];

    blockchain.blocks.forEach((block: Block) => {
      if (block.refBlock === sendSignature) {
        receiveBlock = block;
      }
    });
  });

  return receiveBlock;
};

export const getBlockState = (state: RootState, signature: Signature): BlockState | undefined => {
  let blockState = undefined;

  Object.values(state.chains.signatureToChain).forEach((chain) => {
    const idx = chain.blocks.findIndex((block) => block.signature === signature);

    if (idx !== -1) blockState = chain.blocks[idx].state;
  });

  Object.values(state.chains.rejectedBlocks).forEach((chain) => {
    const idx = chain.blocks.findIndex((block) => block.signature === signature);

    if (idx !== -1) blockState = chain.blocks[idx].state;
  });

  return blockState;
};
