import { Blockchain, Crypto, KeySet, BlockType, AssetSymbol, Transaction } from '@tixl/tixl-types';

import { keySet } from './api/keyset';
import { createOpeningBlock } from './api/open';
import { decryptSender, decryptPayload } from './api/encryption';
import { workingCopy } from './utils';

export type OpeningBlockPayload = KeySet & { stealthchainId?: string };

export type AppendStealthChainChanges = {
  scKeySet: KeySet;
  stealthchain: {
    tx: Transaction;
    blockchain: Blockchain;
  };
  accountchain: {
    tx: Transaction;
    blockchain: Blockchain;
  };
};

export async function appendStealthChain(
  crypto: Crypto,
  accountchain: Blockchain,
  acKeySet: KeySet,
  id: string,
  symbol: AssetSymbol,
): Promise<AppendStealthChainChanges> {
  const accountchainCopy = workingCopy(accountchain);
  const scKeySet = await keySet(crypto);

  // add opening block to account chain
  const leaf = workingCopy(accountchainCopy.leaf());
  if (!leaf) throw 'no leaf for chain found';

  await decryptSender(crypto, leaf, acKeySet.aes);
  const acBalance = leaf.senderBalance;
  const payload: OpeningBlockPayload = { ...scKeySet };

  if (id) {
    payload.stealthchainId = id;
  }

  const openAC = await createOpeningBlock(
    crypto,
    acBalance,
    accountchainCopy.publicSig,
    accountchainCopy.leaf(),
    acKeySet.sig.privateKey,
    acKeySet.ntru.public,
    true,
    JSON.stringify(payload),
    acKeySet.aes,
    AssetSymbol.TXL, // dont change to symbol: the accountchain is set to TXL
  );

  accountchainCopy.addBlock(openAC.block);

  // create stealthchain and get opening block
  const stealthchain = new Blockchain(scKeySet.sig.publicKey, scKeySet.ntru.public, symbol);
  const openSC = await createOpeningBlock(
    crypto,
    0,
    stealthchain.publicSig,
    stealthchain.leaf(),
    scKeySet.sig.privateKey,
    scKeySet.ntru.public,
    true,
    undefined,
    scKeySet.aes,
    symbol,
  );

  stealthchain.addBlock(openSC.block);

  return {
    scKeySet,
    stealthchain: {
      tx: openSC.tx,
      blockchain: stealthchain,
    },
    accountchain: {
      tx: openAC.tx,
      blockchain: accountchainCopy,
    },
  };
}

export async function findStealthchainKeySet(crypto: Crypto, accountchain: Blockchain, acKeySet: KeySet, id: string) {
  let scKeySet: KeySet | undefined;

  await Promise.all(
    accountchain.blocks.map(async (block) => {
      if (block.type !== BlockType.OPENING || !block.prev) return;

      const blockCopy = workingCopy(block);
      await decryptPayload(crypto, blockCopy, acKeySet.aes);
      const payload = JSON.parse(blockCopy.payload) as OpeningBlockPayload;

      if (payload.stealthchainId === id) {
        scKeySet = payload;
      }
    }),
  );

  return scKeySet;
}
