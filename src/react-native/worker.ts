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

import createCrypto from './crypto';

const crypto = createCrypto();

//
// Run on "web worker" for react-native.
// Since there are no web workers, start the crypto and run functions directly.
//
async function runOnWorker<T>(action: string, ...params: any[]): Promise<T | undefined> {
  return new Promise(async (resolve, reject) => {
    // the crypto object is referenced here, so that the dependency is loaded
    // only in this environment
    // @ts-ignore

    const passParams = [crypto, ...params];

    switch (action) {
      case 'keySet':
        // @ts-ignore
        resolve(keySet(...passParams));
        break;
      case 'keySetSeeded':
        // @ts-ignore
        resolve(keySetSeeded(...passParams));
        break;
      case 'calcBalance':
        // @ts-ignore
        resolve(calcBalance(...passParams));
        break;
      case 'loadPublicSigKey':
        // @ts-ignore
        resolve(loadPublicSigKey(...passParams));
        break;
      case 'scanAllUnspentBlocks':
        // @ts-ignore
        resolve(scanAllUnspentBlocks(...passParams));
        break;
      case 'deposit':
        // @ts-ignore
        resolve(deposit(...passParams));
        break;
      case 'withdraw':
        // @ts-ignore
        resolve(withdraw(...passParams));
        break;
      case 'createAccountChain':
        // @ts-ignore
        resolve(createAccountChain(...passParams));
        break;
      case 'receive':
        // @ts-ignore
        resolve(receive(...passParams));
        break;
      case 'send':
        // @ts-ignore
        resolve(send(...passParams));
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
