import cloneDeepWith from 'lodash/cloneDeepWith';

import {
  keySet,
  keySetSeeded,
  calcBalance,
  loadPublicSigKey,
  scanAllUnspentBlocks,
  deposit,
  withdraw,
  createAccountChain,
  receive,
  send,
} from '../workflows';
import { cloneValue } from '../helpers/cloneValue';
import createCrypto from './crypto';

// the crypto object is referenced here, so that the dependency is loaded
// only in this environment
const crypto = createCrypto();

//
// Run on "web worker" for react-native.
// Since there are no web workers, start the crypto and run functions directly.
//
async function runOnWorker<T>(action: string, ...paramsIn: any[]): Promise<T | undefined> {
  return new Promise(async (resolve, reject) => {
    const params: any = paramsIn.map((item: any) => cloneDeepWith(item, cloneValue));

    // prepend crypto as first param
    params.splice(0, 0, crypto);

    switch (action) {
      case 'keySet':
        // @ts-ignore
        resolve(keySet(...params));
        break;
      case 'keySetSeeded':
        // @ts-ignore
        resolve(keySetSeeded(...params));
        break;
      case 'calcBalance':
        // @ts-ignore
        resolve(calcBalance(...params));
        break;
      case 'loadPublicSigKey':
        // @ts-ignore
        resolve(loadPublicSigKey(...params));
        break;
      case 'scanAllUnspentBlocks':
        // @ts-ignore
        resolve(scanAllUnspentBlocks(...params));
        break;
      case 'deposit':
        // @ts-ignore
        resolve(deposit(...params));
        break;
      case 'withdraw':
        // @ts-ignore
        resolve(withdraw(...params));
        break;
      case 'createAccountChain':
        // @ts-ignore
        resolve(createAccountChain(...params));
        break;
      case 'receive':
        // @ts-ignore
        resolve(receive(...params));
        break;
      case 'send':
        // @ts-ignore
        resolve(send(...params));
        break;
      default:
        console.log('missing method', action as any);
        reject('missing method');
    }
  });
}

declare global {
  interface Window {
    RNrunOnWorker<T>(action: string, ...params: any[]): Promise<T | undefined>;
  }
}

window.RNrunOnWorker = runOnWorker;
