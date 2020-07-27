import { Blockchain, Crypto, KeySet, BlockchainTx } from '@tixl/tixl-types';

import { createOpeningBlock } from './api/open';

export async function createAccountChain(crypto: Crypto, keyset: KeySet): Promise<BlockchainTx> {
  const blockchain = new Blockchain(keyset.sig.publicKey, keyset.ntru.public);
  const open = await createOpeningBlock(
    crypto,
    0,
    blockchain.publicSig,
    blockchain.leaf(),
    keyset.sig.privateKey,
    keyset.ntru.public,
    true,
    JSON.stringify(keyset),
    keyset.aes,
  );

  blockchain.addBlock(open.block);

  return {
    tx: open.tx,
    blockchain,
  };
}
