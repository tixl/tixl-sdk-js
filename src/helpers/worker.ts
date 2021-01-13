// use a listener map to map results
const listener: Record<string, Function> = {};

// connect to a Web-worker
// e.g. in browser environments
let mainWorker: Worker;

if (typeof Worker !== 'undefined') {
  mainWorker = new Worker('/web-worker.js');
  mainWorker.onmessage = function (e) {
    const [id, result, err] = e.data;

    if (listener[id]) {
      listener[id](result, err);
    }
  };
}

/**
 * Handle an action with params.
 * The result is send back via a listener and then resolves the promise.
 */
export async function runOnWorker<T>(action: string, ...params: any[]): Promise<T | undefined> {
  if (typeof Worker !== 'undefined') {
    // Browser environment
    return new Promise(async (resolve, reject) => {
      const id = Math.random().toString();

      // setup listener to resolve any result
      listener[id] = (res: any, err?: any) => {
        if (err) {
          return reject(err);
        }

        if (res === null) {
          console.error('no result from worker for action', action);
        }

        resolve(res);
        delete listener[id];
      };

      // send call to worker
      mainWorker.postMessage([id, action].concat(params));
    });
  } else {
    // Other environment e.g. Expo / React-native
    // Call functions directly
    return window.RNrunOnWorker(action, ...params);
  }
}
