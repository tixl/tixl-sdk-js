import { Crypto, KeySet, AssetSymbol, Block } from '@tixl/tixl-types';

import { keySet, keySetSeeded, calcBalance, send } from '../workflows';
import { getBlockchain } from '../requests/getBlockchain';
import { postTransaction, PostTxResponse } from '../requests/postTransaction';
import { GatewayErrors } from '../helpers/errors';

export type Wallet = {
  keySet: KeySet;
  getBalance: (symbol: AssetSymbol) => Promise<string>;
  transfer: (
    address: string,
    symbol: AssetSymbol,
    amount: string,
  ) => Promise<PostTxResponse | GatewayErrors | undefined>;
  onTransfer: (handler: (block: Block) => any) => void;
  scan: (handler: (block: Block) => any) => void;
};

export default function (crypto: Crypto) {
  return {
    async createNew(): Promise<Wallet> {
      const walletKeySet = await keySet(crypto);

      return createWallet(crypto, walletKeySet);
    },

    async fromPrivateKey(privateKey: string): Promise<Wallet> {
      const walletKeySet = await keySetSeeded(crypto, privateKey);

      return createWallet(crypto, walletKeySet);
    },
  };
}

function createWallet(crypto: Crypto, keys: KeySet): Wallet {
  return {
    keySet: keys,

    async getBalance(symbol: AssetSymbol) {
      const accountChain = await getBlockchain(keys);

      return calcBalance(crypto, accountChain, keys, symbol);
    },

    async transfer(address: string, symbol: AssetSymbol, amount: string) {
      const accountChain = await getBlockchain(keys);
      const sendTx = await send(crypto, keys, accountChain, amount, address, symbol);

      if (!sendTx) return;

      return postTransaction(sendTx.tx);
    },

    onTransfer(handler: (block: Block) => any) {
      throw 'not yet implemented';
    },

    scan(handler: (block: Block) => any) {
      throw 'not yet implemented';
    },
  };
}
