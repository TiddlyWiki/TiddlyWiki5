#!/bin/bash
# Download jasmine packages from npm and unpack relevant files
# into files/.

set -exuo pipefail

JASMINE_VERSION=3.4.0
JASMINE_CORE_VERSION=3.4.0

rm -rf files/jasmine
mkdir -p files/jasmine
if [ ! -f "jasmine-$JASMINE_VERSION.tgz" ]; then
    npm pack jasmine@$JASMINE_VERSION
fi
tar xfzv jasmine-$JASMINE_VERSION.tgz \
    -C files/jasmine \
    --strip-components=1 \
    --wildcards "*/lib/*.js" "*/*.LICENSE" \
    --exclude "example"

rm -rf files/jasmine-core
mkdir -p files/jasmine-core
if [ ! -f "jasmine-core-$JASMINE_CORE_VERSION.tgz" ]; then
    npm pack jasmine-core@$JASMINE_CORE_VERSION
fi
tar xfzv jasmine-core-$JASMINE_CORE_VERSION.tgz \
    -C files/jasmine-core \
    --strip-components=1 \
    --wildcards "*/lib/*.js" "*/lib/*.css" "*/*.LICENSE" \
    --exclude "example"
