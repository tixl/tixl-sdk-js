import {
  Blockchain,
  fromBlockchainObject,
  fromBlockObject,
  isBlock,
  isBlockchain,
  isBlockchainRecord,
} from '@tixl/tixl-types';

// restore object class methods e.g. leaf() or blocks()
// objects get serialized and lose their class methods...
export function cloneValue(val: any) {
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
