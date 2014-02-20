#!/bin/bash

# Abbreviated version of bld.sh for quicker builds

# Set up the build output directory

if [  -z "$TW5_BUILD_OUTPUT" ]; then
    TW5_BUILD_OUTPUT=../jermolene.github.com
fi

if [  ! -d "$TW5_BUILD_OUTPUT" ]; then
    echo 'A valid TW5_BUILD_OUTPUT environment variable must be set'
    exit 1
fi

echo "Using TW5_BUILD_OUTPUT as [$TW5_BUILD_OUTPUT]"

# Make the CNAME file that GitHub Pages requires

echo "tiddlywiki.com" > $TW5_BUILD_OUTPUT/CNAME

# The tw5.com wiki
#  index.html: the main file, including content

node ./tiddlywiki.js \
	./editions/de-AT-DE \
	--verbose \
	--rendertiddler $:/core/save/all $TW5_BUILD_OUTPUT/de-AT-DE.html text/plain \
	--savetiddler $:/favicon.ico $TW5_BUILD_OUTPUT/favicon.ico \
	|| exit 1

node ./tiddlywiki.js \
	./editions/zh-Hant \
	--verbose \
	--rendertiddler $:/core/save/all $TW5_BUILD_OUTPUT/zh-Hant.html text/plain \
	--savetiddler $:/favicon.ico $TW5_BUILD_OUTPUT/favicon.ico \
	|| exit 1
