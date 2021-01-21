import {
  KeySet,
  Crypto,
  SigPublicKey,
  SigPrivateKey,
  Transaction,
  Block,
  Blockchain,
  AssetSymbol,
} from '@tixl/tixl-types';

import { setTxBlockNonces } from '../lib/microPow';
import { mergeTransactions } from '../helpers/transactions';
import { createAccountChain } from './accountchain';

import { keySet } from './api/keyset';
import { receive } from './receive';
import { send } from './send';

// create a keyset and prepare the opening transaction
// this is used to create temporary wallets
export async function prepareTransientWallet(crypto: Crypto): Promise<{ keySet: KeySet; tx: Transaction }> {
  const transientKeys = await keySet(crypto);
  const transientAccount = await createAccountChain(crypto, transientKeys);
  setTxBlockNonces(transientAccount.tx);

  return { keySet: transientKeys, tx: transientAccount.tx };
}

// move unspent funds from a transient wallet to another wallet
// receives unspent send blocks on the transient wallet
// and creates a send block
export async function sendFromTransientWallet(
  crypto: Crypto,
  sendAccountPubKey: SigPublicKey,
  transientKeys: KeySet,
  transientAccount: Blockchain,
  symbol: AssetSymbol,
  sendBlock?: Block,
): Promise<{ txs: Transaction[] }> {
  const txs = [];

  let payload = 'From transient wallet';
  let useTransientAccount = transientAccount;

  if (sendBlock) {
    if (!sendBlock.symbol) {
      throw new Error('Send block without symbol');
    }

    if (sendBlock.payload) {
      payload = sendBlock.payload;
    }

    // receive block
    const receiveData = await receive(crypto, transientKeys, transientAccount, sendBlock, symbol);
    const updates = [];

    if (receiveData.accountchainAsset) {
      updates.push(receiveData.accountchainAsset);
    }

    if (receiveData.assetReceive) {
      updates.push(receiveData.assetReceive);
    }

    // proof of work
    updates.forEach((update) => {
      setTxBlockNonces(update.tx);
    });

    const receiveTxs = updates.map((update) => update.tx);

    // build the receive tx
    const receiveTx = mergeTransactions(receiveTxs);
    txs.push(receiveTx);

    useTransientAccount = receiveData.assetReceive.blockchain;
  }

  // create the send tx that "moves" the funds back to the non-transient wallet
  const assetLeaf = await useTransientAccount.leafAsset(symbol);

  if (!assetLeaf) {
    throw new Error('Could not get updated asset leaf block');
  }

  const sendTx = await send(
    crypto,
    transientKeys,
    useTransientAccount,
    assetLeaf.senderBalance,
    sendAccountPubKey,
    symbol,
    payload,
  );

  if (!sendTx) {
    throw new Error('Could not create send tx from transient wallet');
  }

  setTxBlockNonces(sendTx.tx);

  // send updates as a multi tx
  txs.push(sendTx.tx);

  return {
    txs,
  };
}
