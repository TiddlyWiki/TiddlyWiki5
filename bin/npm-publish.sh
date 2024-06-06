#!/bin/bash

# publish to npm

./bin/clean.sh

npm publish || exit 1
