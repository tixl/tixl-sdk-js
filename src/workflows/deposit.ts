import JSBI from 'jsbi';
import { Blockchain, Crypto, KeySet, AssetSymbol, Transaction } from '@tixl/tixl-types';

import { decryptSender } from './api/encryption';
import { createDepositBlock } from './api/deposit';
import { findStealthchainKeySet, appendStealthChain } from './stealthchain';
import { workingCopy, BlockchainIndex } from './utils';

export type DepositChanges = {
  accountChainOpen:
    | {
        tx: Transaction;
        blockchain: Blockchain;
      }
    | undefined;
  stealthChainOpen:
    | {
        tx: Transaction;
        blockchain: Blockchain;
      }
    | undefined;
  stealthChainDeposit: {
    tx: Transaction;
    blockchain: Blockchain;
  };
};

export async function depositTx(
  crypto: Crypto,
  keySet: KeySet,
  blockchain: Blockchain,
  amount: string | number | bigint,
  extAddress: string,
  symbol: AssetSymbol,
  claimSignature?: string,
) {
  const blockchainCopy = workingCopy(blockchain);
  const leaf = workingCopy(blockchainCopy.leaf());

  if (!leaf) throw 'no leaf for chain found';

  await decryptSender(crypto, leaf, keySet.aes);

  const newBalance = JSBI.add(JSBI.BigInt(leaf.senderBalance), JSBI.BigInt(amount.toString()));
  console.log('deposit new balance', newBalance);

  const deposit2wallet = await createDepositBlock(
    crypto,
    leaf,
    blockchainCopy.publicSig,
    extAddress,
    amount,
    newBalance.toString(),
    symbol,
    claimSignature,
    keySet.sig.privateKey,
    keySet.aes,
  );

  blockchainCopy.addBlock(deposit2wallet.block);

  return {
    blockchain: blockchainCopy,
    tx: deposit2wallet.tx,
    receiveBlock: deposit2wallet.block,
  };
}

/**
 * Create several transactions to receive a send block onto a stealthchain.
 *
 * @param stealthId use send block signature
 */
export async function deposit(
  crypto: Crypto,
  acKeySet: KeySet,
  accountchain: Blockchain,
  amount: string | number | bigint,
  extAddress: string,
  symbol: AssetSymbol,
  stealthChainId: string,
  loader: BlockchainIndex,
  claimSignature?: string,
): Promise<DepositChanges> {
  // load stealth chain
  let stealthchain: Blockchain | undefined;
  let scKeySet = await findStealthchainKeySet(crypto, accountchain, acKeySet, stealthChainId);

  // if not exist => append stealthchain (id = stealthId)
  let create;

  if (!scKeySet) {
    create = await appendStealthChain(crypto, accountchain, acKeySet, stealthChainId, symbol);
    stealthchain = create.stealthchain.blockchain;
    scKeySet = create.scKeySet;
  } else {
    stealthchain = loader[scKeySet.sig.publicKey as string];
  }

  if (!stealthchain) throw 'could not load or create stealthchain';

  // deposit on stealthchain
  const deposit = await depositTx(crypto, scKeySet, stealthchain, amount, extAddress, symbol, claimSignature);

  // return all writable TX
  return {
    accountChainOpen: create && create.accountchain,
    stealthChainOpen: create && create.stealthchain,
    stealthChainDeposit: {
      tx: deposit.tx,
      blockchain: deposit.blockchain,
    },
  };
}
