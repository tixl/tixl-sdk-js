import cloneDeep from 'lodash/cloneDeep';

export function workingCopy<T>(obj: T): T {
  return cloneDeep(obj);
}
