import { GeneralAction } from './actionTypes';
import { UPDATE_BLOCK_STATE_REJECTED, UPDATE_BLOCK_STATE_ACCEPTED, UPDATE_CHAIN } from './actionKeys';
import { BlockchainWithAdditionalInfo, BlockWithAdditionalInfo } from './types';
import { RESET_ALL_DATA } from '../global/actionKeys';

export type SignatureToChain = Record<string, BlockchainWithAdditionalInfo>;
export type RejectBlockIndex = Record<string, { blocks: BlockWithAdditionalInfo[] }>;

export interface ChainsReduxState {
  signatureToChain: SignatureToChain;
  rejectedBlocks: RejectBlockIndex;
}

const initialState: ChainsReduxState = {
  signatureToChain: {},
  rejectedBlocks: {},
};

interface BlockIndex {
  chainPublicKey: string;
  blockArrayIndex: number;
}

const getBlockIndex = (
  signatureToChain: SignatureToChain,
  queryField: string,
  queryValue: string,
): BlockIndex | null => {
  let blockIndex = null;
  Object.keys(signatureToChain).forEach((key: string) => {
    const chain = signatureToChain[key];
    chain.blocks.forEach((block: BlockWithAdditionalInfo, index: number) => {
      if ((block as any)[queryField] === queryValue) {
        blockIndex = {
          chainPublicKey: key,
          blockArrayIndex: index,
        };
      }
    });
  });
  return blockIndex;
};

export function reducer(state = initialState, action: GeneralAction): ChainsReduxState {
  switch (action.type) {
    case UPDATE_CHAIN: {
      return {
        ...state,
        signatureToChain: {
          ...state.signatureToChain,
          [action.chain.publicSig as string]: action.chain,
        },
      };
    }
    case UPDATE_BLOCK_STATE_REJECTED: {
      // remove the block from the signatureToChain index
      // move it over to a secondary index for rejected blocks
      const blockIndex = getBlockIndex(state.signatureToChain, 'signature', action.signature as string);

      if (!blockIndex) {
        return state;
      }

      const signatureToChain = {
        ...state.signatureToChain,
      };
      const rejectedBlocks = {
        ...state.rejectedBlocks,
      };

      if (!rejectedBlocks[blockIndex.chainPublicKey]) {
        rejectedBlocks[blockIndex.chainPublicKey] = {
          blocks: [],
        };
      }

      // copy the block
      const movingBlock = {
        ...signatureToChain[blockIndex.chainPublicKey].blocks[blockIndex.blockArrayIndex],
        state: 'rejected',
      } as BlockWithAdditionalInfo;

      // into the rejected block list
      rejectedBlocks[blockIndex.chainPublicKey].blocks.push(movingBlock);

      // remove from "pending | accepted" block index
      signatureToChain[blockIndex.chainPublicKey].blocks.splice(blockIndex.blockArrayIndex, 1);

      // if chain is now empty, remove index
      if (signatureToChain[blockIndex.chainPublicKey].blocks.length === 0) {
        delete signatureToChain[blockIndex.chainPublicKey];
      }

      return {
        ...state,
        signatureToChain,
        rejectedBlocks,
      };
    }
    case UPDATE_BLOCK_STATE_ACCEPTED: {
      // mark block as accepted inside the signatureToChain index
      const blockIndex = getBlockIndex(state.signatureToChain, 'signature', action.signature as string);

      if (!blockIndex) {
        return state;
      }

      const signatureToChain = {
        ...state.signatureToChain,
      };

      signatureToChain[blockIndex.chainPublicKey].blocks[blockIndex.blockArrayIndex].state = 'accepted';

      return {
        ...state,
        signatureToChain,
      };
    }
    case RESET_ALL_DATA:
      return initialState;
    default:
      return state;
  }
}
