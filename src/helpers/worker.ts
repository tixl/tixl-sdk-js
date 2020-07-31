const mainWorker = new Worker('/web-worker.js');

// use a listener map to map results
const listener: Record<string, Function> = {};

mainWorker.onmessage = function (e) {
  const [id, result, err] = e.data;

  if (listener[id]) {
    listener[id](result, err);
  }
};

/**
 * Send an action to the web worker with params.
 *
 * The result is send back via a listener and then resolves the promise.
 */
export async function runOnWorker<T>(action: string, ...params: any[]): Promise<T | undefined> {
  return new Promise(async (resolve, reject) => {
    const id = Math.random().toString();

    // setup listener to resolve any result
    listener[id] = (res: any, err?: any) => {
      if (err) {
        return reject(err);
      }

      if (!res) {
        console.error('no result from worker for action', action);
      }

      resolve(res);
      delete listener[id];
    };

    // send call to worker
    mainWorker.postMessage([id, action].concat(params));
  });
}
