import { Block, Blockchain } from '@tixl/tixl-types';

export type BlockState = 'accepted' | 'rejected' | 'pending';

export interface BlockWithAdditionalInfo extends Block {
  state: BlockState;
}

export interface BlockchainWithAdditionalInfo extends Blockchain {
  blocks: BlockWithAdditionalInfo[];
}
