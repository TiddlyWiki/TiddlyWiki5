#!/bin/bash

# run TiddlyWiki5

pushd editions/tw5.com > /dev/null

node ../../tiddlywiki.js \
	--verbose \
	--wikitest ../../tests/wikitests/ \
	|| exit 1

popd > /dev/null

# run jshint
jshint core
jshint plugins
