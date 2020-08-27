import { Crypto, KeySet, AssetSymbol, Block } from '@tixl/tixl-types';

import { keySet, keySetSeeded, calcBalance, send } from '../workflows';
import { getBlockchain } from '../requests/getBlockchain';
import { createLoader } from '../workflows/utils';
import { postTransaction } from '../requests/postTransaction';

export type Wallet = {
  keySet: KeySet;
  getBalance: (symbol: AssetSymbol) => Promise<string>;
  transfer: (address: string, symbol: AssetSymbol, amount: string) => Promise<void>;
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
      const loader = await createLoader(crypto, keys, accountChain);

      return calcBalance(crypto, accountChain, keys, loader, symbol);
    },

    async transfer(address: string, symbol: AssetSymbol, amount: string) {
      const accountChain = await getBlockchain(keys);
      const loader = await createLoader(crypto, keys, accountChain);
      const sendTx = await send(crypto, keys, accountChain, amount, address, symbol, loader);

      if (!sendTx) return;

      await Promise.all(sendTx.map(async (update) => postTransaction(update.tx)));
    },

    onTransfer(handler: (block: Block) => any) {
      throw 'not yet implemented';
    },

    scan(handler: (block: Block) => any) {
      throw 'not yet implemented';
    },
  };
}
