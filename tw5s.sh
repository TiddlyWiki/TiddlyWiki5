#!/bin/sh

# serve TiddlyWiki5 over HTTP

# cook TiddlyWiki5
node tiddlywiki.js --recipe $PWD/tiddlywiki5/tiddlywiki5.recipe --servewiki 8080 || exit 1
