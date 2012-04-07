#!/bin/sh

# serve TiddlyWiki5 over HTTP

# make a copy of the content store
mkdir -p tmp/store
rm tmp/store/*.*
cp tiddlywiki5/store/*.* tmp/store

# cook TiddlyWiki5
node tiddlywiki.js \
	--recipe $PWD/tiddlywiki5/tiddlywiki5.recipe \
	--store tmp/store \
	--servewiki 8080 \
	|| exit 1
