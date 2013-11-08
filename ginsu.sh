#!/bin/bash

# Split the tiddlers out of a TiddlyWiki file

mkdir -p tmp
mkdir -p tmp/ginsu

node ./tiddlywiki.js \
	./editions/empty \
	--verbose \
	--load $1 \
	--new_rendertiddler $:/core/templates/split-recipe tmp/ginsu/split.recipe text/plain \
	--new_rendertiddlers [!is[system]] $:/core/templates/tid-tiddler tmp/ginsu text/plain .tid \
	|| exit 1
