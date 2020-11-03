import cloneDeepWith from 'lodash/cloneDeepWith';
import {
  fromBlockObject,
  fromBlockchainObject,
  Blockchain,
  isBlockchain,
  isBlockchainRecord,
  isBlock,
} from '@tixl/tixl-types';

import {
  keySet,
  keySetSeeded,
  calcBalance,
  getPublicSig,
  scanAllUnspentBlocks,
  deposit,
  withdraw,
  createAccountChain,
  receive,
  send,
} from '../../src/workflows';

import createCrypto from './crypto';

// restore object class methods e.g. leaf() or blocks()
// objects get serialized and lose their class methods...
function cloneValue(val: any) {
  if (isBlockchain(val)) return fromBlockchainObject(val);
  if (isBlock(val)) return fromBlockObject(val);
  if (isBlockchainRecord(val)) {
    const res: Record<string, Blockchain> = {};

    Object.keys(val).map((key: string) => {
      const obj = val[key];
      res[key] = isBlockchain(obj) ? fromBlockchainObject(val[key]) : obj;
    });

    return res;
  }
  return val;
}

// init web-worker based crypto functions
const crypto = createCrypto();

type EventData = { data: string[] };

onmessage = function (event: EventData) {
  const [id, action, ...paramsIn] = event.data;

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
      case 'getPublicSig':
        res = await getPublicSig.apply(self, params);
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
