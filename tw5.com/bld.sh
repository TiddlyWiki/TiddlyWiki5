#!/bin/sh

# build TiddlyWiki5

# create a temporary directory if it doesn't already exist
mkdir -p tmp
mkdir -p tmp/tw5

# cook TiddlyWiki5
node ../core/boot.js --verbose \
	--savetiddler $:/core/tiddlywiki5.template.html tmp/tw5/index.html text/plain \
	--savetiddler $:/core/static.template.html tmp/tw5/static.html text/plain || exit 1
