#!/bin/bash

# Split the tiddlers out of a TiddlyWiki file

mkdir -p tmp
mkdir -p tmp/ginsu

node ./tiddlywiki.js \
	./editions/empty \
	--verbose \
	--load $1 \
	--savetiddlers [!is[system]] $:/core/templates/tid-tiddler tmp/ginsu text/plain .tid \
	|| exit 1
