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
  prepareTransientWallet,
  sendFromTransientWallet,
} from '../../src/workflows';

import createCrypto from './crypto';
import { cloneValue } from '../../src/helpers/cloneValue';

// init web-worker based crypto functions
const crypto = createCrypto();

type EventData = { data: string[] };

onmessage = function (event: EventData) {
  const [id, action, ...paramsIn] = event.data;

  // @ts-ignore
  const self: WorkerGlobalScope = this;

  async function run() {
    // map transferred objects back to usable class instances
    const params: any = paramsIn.map((item: any) => cloneDeepWith(item, cloneValue));

    // prepend crypto as first param
    params.splice(0, 0, crypto);

    let res = undefined;

    switch (action) {
      case 'keySet':
        res = await keySet.apply(self, params);
        break;
      case 'keySetSeeded':
        res = await keySetSeeded.apply(self, params);
        break;
      case 'calcBalance':
        res = await calcBalance.apply(self, params);
        break;
      case 'loadPublicSigKey':
        res = await loadPublicSigKey.apply(self, params);
        break;
      case 'scanAllUnspentBlocks':
        res = await scanAllUnspentBlocks.apply(self, params);
        break;
      case 'deposit':
        res = await deposit.apply(self, params);
        break;
      case 'withdraw':
        res = await withdraw.apply(self, params);
        break;
      case 'createAccountChain':
        res = await createAccountChain.apply(self, params);
        break;
      case 'receive':
        res = await receive.apply(self, params);
        break;
      case 'send':
        res = await send.apply(self, params);
        break;
      case 'prepareTransientWallet':
        res = await prepareTransientWallet.apply(self, params);
        break;
      case 'sendFromTransientWallet':
        res = await sendFromTransientWallet.apply(self, params);
        break;
      default:
        console.log('missing method', action);
    }

    return res;
  }

  run()
    .then((res) => {
      postMessage([id, res]);
    })
    .catch((err) => {
      postMessage([id, null, err.toString()]);
    });
};
