#!/bin/bash

# test TiddlyWiki5

# create a temporary directory if it doesn't already exist

mkdir -p tmp
mkdir -p tmp/test

# build test.html

node ./tiddlywiki.js \
	./editions/test \
	--verbose \
	--savetiddler $:/core/templates/tiddlywiki5.template.html tmp/test/index.html text/plain \
	|| exit 1
