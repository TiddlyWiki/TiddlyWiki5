#!/bin/bash

# Split the tiddlers out of a TiddlyWiki file

mkdir -p tmp
mkdir -p tmp/ginsu

node ./tiddlywiki.js \
	./editions/empty \
	--verbose \
	--load $1 \
	--savetiddler $:/core/templates/split-recipe tmp/ginsu/split.recipe text/plain \
	--savetiddlers [!is[system]] $:/core/templates/tid-tiddler tmp/ginsu text/plain .tid \
	|| exit 1
