import { Crypto } from '@tixl/tixl-types';

import Wallet from '../wallet';

export { createCrypto } from './crypto';

export function Tixl(crypto: Crypto) {
  return {
    Wallet: Wallet(crypto),
  };
}
