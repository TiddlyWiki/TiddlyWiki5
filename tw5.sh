#!/bin/sh

# build TiddlyWiki5

# create a temporary directory if it doesn't already exist
mkdir -p tmp
mkdir -p tmp/tw5

# cook TiddlyWiki5
node tiddlywiki.js --recipe $PWD/tiddlywiki5/tiddlywiki5.recipe --savewiki tmp/tw5 --savetiddler ReadMe readme.html || exit 1


# open the result
#open -a /Applications/Google\ Chrome.app tmp/tw5/index.html
