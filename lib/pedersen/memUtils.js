const Long = require('long');
const Module = self.Module._malloc ? self.Module : self;

export const Uint64Long = ptr => new Long(Module.getValue(ptr, 'i32'), Module.getValue(ptr + 4, 'i32'), true);

export function charStar(buf) {
  const ptr = malloc(buf.length);
  for (let i = 0; i < buf.length; i++) {
    Module.setValue(ptr + i, buf[i], 'i8');
  }
  return ptr;
}

export function charStarArray(array) {
  const arrayPtrs = malloc(4 * array.length);
  for (let cnt = 0; cnt < array.length; cnt++) {
    const ptr = charStar(array[cnt]);
    Module.setValue(arrayPtrs + cnt * 4, ptr, 'i32');
  }
  return arrayPtrs;
}

let free = [];

export function malloc(size) {
  if (free.length === 0) {
    setTimeout(() => {
      freeMalloc();
    });
  }
  const ptr = Module._malloc(size);
  free.push(ptr);
  return ptr;
}

export function freeMalloc() {
  for (const ptr of free) {
    Module._free(ptr);
  }
  free = [];
}
