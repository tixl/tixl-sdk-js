# Tixl JavaScript SDK

## Intro

The SDK provides builds for different environments:

1. Node.js
2. Web Worker (Browser)

## Repo structure

`node-js/` folder contains the TS build for the Node.js environment. Build it with `yarn build:nodejs`.

`web-worker/` folder contains a webpack + TS based build to run in a browser environment. Build it with `yarn build:worker`.

`src/` folder contains mostly shared TS code.

## Modules

- `@tixl/tixl-sdk-js/redux/`
- `@tixl/tixl-sdk-js/web-worker`
- `@tixl/tixl-sdk-js/node.js`

## Registry package

`yarn build` creates a `dist/` folder which contains the package to publish to a registry. The package has its own package.json, that is copied over at build time.

Tu publish a new version, `cd` into `dist` and run yarn publish from there.
