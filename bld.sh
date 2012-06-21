#!/bin/bash

# build TiddlyWiki5

# create a temporary directory if it doesn't already exist
mkdir -p tmp
mkdir -p tmp/tw5

# cook TiddlyWiki5

pushd tw5.com > /dev/null

node ../core/boot.js \
	--verbose \
	--savetiddler ReadMe ../readme.md text/html \
	--savetiddler $:/core/templates/tiddlywiki5.template.html ../../jermolene.github.com/index.html text/plain \
	--savetiddler $:/core/templates/static.template.html ../../jermolene.github.com/static.html text/plain \
	|| exit 1

popd > /dev/null
