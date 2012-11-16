#!/bin/bash

# build TiddlyWiki 2.x

# create a temporary directory if it doesn't already exist
mkdir -p tmp
mkdir -p tmp/tw2

# cook TiddlyWiki5

pushd editions/tw2 > /dev/null

node ../../core/boot.js \
	--verbose \
	--load source/tiddlywiki.com/index.html.recipe \
	--savetiddler $:/core/templates/tiddlywiki2.template.html ../../tmp/tw2/index.html text/plain \
	|| exit 1

popd > /dev/null

opendiff tmp/tw2/index.html editions/tw2/target/index.2.6.5.html
