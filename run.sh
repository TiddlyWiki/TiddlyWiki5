#!/bin/sh

# run TiddlyWiki5

pushd tw5.com > /dev/null

node ../core/boot.js \
	--verbose \
	--wikitest ../tests/wikitests/ \
	|| exit 1

popd > /dev/null

# run jshint
jshint core
