# lib-ntru

is based on the work of https://github.com/cyph/ntru.js

## Changes

* the make file is adapted to run with the mac os version of sed
* terser is added as a dependency and used as a local install

## How to use the Dockerfile

_Note: the image will be faily large_

This will create a docker image based on ./Dockerfile. During image building the lib-ntru file is compiled.
The file is then copied from the image to the ./dist folder. Afterwards the container is removed.

```bash
mkdir ./dist
docker build -t lib-ntru .
docker create -ti --name lib-ntru lib-ntru bash
docker cp lib-ntru:/usr/src/app/dist/ntru.js ./dist/ntru.js
docker rm lib-ntru
```
