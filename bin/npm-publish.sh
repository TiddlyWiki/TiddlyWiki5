#!/bin/bash

# publish to npm

./bin/clean.sh

# Build typings
npm i typescript
npx tsc

npm publish || exit 1
