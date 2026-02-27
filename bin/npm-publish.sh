#!/bin/bash

# publish to npm

./bin/clean.sh

# Install dev dependencies (includes typescript)
npm install

# Generate TypeScript declaration files in types/core/
npx tsc

npm publish || exit 1
