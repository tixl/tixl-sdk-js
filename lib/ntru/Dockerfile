FROM ubuntu:18.04

# Install OS dependencies
RUN apt-get update && apt-get install -y -q --no-install-recommends \
        apt-transport-https \
        build-essential \
        ca-certificates \
        curl \
        git \
        libssl-dev \
        wget \
        python \
        libxml2 \
        libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

# Install node
RUN mkdir /root/.nvm
ENV NVM_DIR /root/.nvm
ENV NODE_VERSION 12.13.1
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash
RUN /bin/bash -c "source $NVM_DIR/nvm.sh && nvm install $NODE_VERSION && nvm use --delete-prefix $NODE_VERSION"

ENV NODE_PATH $NVM_DIR/versions/node/$NODE_VERSION/lib/node_modules
ENV PATH      $NVM_DIR/versions/node/$NODE_VERSION/bin:$PATH

# Install emscripten
WORKDIR /usr/src
RUN git clone https://github.com/emscripten-core/emsdk.git
WORKDIR /usr/src/emsdk
RUN git pull && \
    ./emsdk install latest && \
    ./emsdk activate latest

# Build project
WORKDIR /usr/src/app
ADD package.json package-lock.json pre.js post.js ntru.c ntru.d.ts Makefile ./
RUN /bin/bash -c "source $NVM_DIR/nvm.sh && npm install"
RUN /bin/bash -c "source $NVM_DIR/nvm.sh && source /usr/src/emsdk/emsdk_env.sh && npm run build"
