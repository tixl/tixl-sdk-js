# Tixl JavaScript SDK

The SDK provides builds for different environments:

1. Node.js
2. Web Worker (Browser)

## ⚠️ Disclaimer

This SDK does currently have some private repositories as dependencies. These dependencies will be released open source in the short-term. There is a refactoring currently happening on the branch [feature/optional-privacy](https://github.com/tixl/tixl-sdk-js/tree/feature/optional-privacy) and we recommend to start using this SDK as soon as the refactoring is completed.

## Repository structure

`web-worker/` folder contains a webpack based build to run in a browser environment. It can be built with `yarn build:worker`.

`src/` folder contains shared and node-js code.

`lib/` folder contains the NTRU and pedersen builds. 

## Modules

- `@tixl/tixl-sdk-js/redux`
- `@tixl/tixl-sdk-js/web-worker`
- `@tixl/tixl-sdk-js/node-js`

## How to use the SDK

Include the SDK in your TypeScript project as usual: `npm install @tixl/tixl-types @tixl/tixl-sdk-js`

Setup an env variable for the gateway. Only the test gateway can currently be used: `REACT_APP_GATEWAY=https://gateway.tixl.dev`

### Crypto Interface

All crypto-related functions are platform dependent and need a suiting implementation. The interface for our `crypto` requirements are defined in the [tixl-types](https://github.com/tixl/tixl-types/blob/master/src/Crypto.ts) repository.

We created a basic node.js implementation that you can use. Have a look at the `src/node-js/crypto` module for a factory-function. Many of the workflow functions have crypto as a required parameter.

The web-worker implementation exists for browser environments.

### Workflows

Everything you can do to interact with the Tixl network is located in the workfows folder (`src/workflows`). The first thing you would probably want to generate is a keyset and the account chain.

Most of the workflows generate BlockTx or BlockchainTx objects, that hold the Transactions that must be sent to the gateway.

From there it is exploring the workflows and lower-level API functions. All functions are written in TypeScript and self-explaining.

### Redux

If you want to use redux, we created redux-modules, reducers and actions to help with that.

#### Registry package

`yarn build` creates a `dist/` folder which contains the package to publish to a registry. The package has its own package.json, that is copied over at build time.

To publish a new version, `cd` into `dist` and run yarn publish from there.
