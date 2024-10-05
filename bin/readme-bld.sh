#!/bin/bash

# Build readmes from corresponding tiddlers

# Default to the version of TiddlyWiki installed in this repo

if [  -z "$TW5_BUILD_TIDDLYWIKI" ]; then
    TW5_BUILD_TIDDLYWIKI=./tiddlywiki.js
fi

# tw5.com readmes
node $TW5_BUILD_TIDDLYWIKI \
	editions/tw5.com \
	--verbose \
	--output . \
	--build readmes \
	|| exit 1

# tw.org readmes
node $TW5_BUILD_TIDDLYWIKI \
	editions/tw.org \
	--verbose \
	--output . \
	--build readmes \
	|| exit 1
