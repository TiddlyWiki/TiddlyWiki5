#!/bin/sh

# create a temporary directory if it doesn't already exist
mkdir -p tmp

# cook tiddlywiki 2.6.5 with cook.js
node cook.js $PWD/test/tiddlywiki.2.6.5/source/tiddlywiki.com/index.html.recipe > tmp/newcooked.html || exit 1

# compare the two
opendiff tmp/newcooked.html test/tiddlywiki.2.6.5/target/index.2.6.5.html

# split the newly cooked tiddlywiki into tiddlers, first with the new ginsu
#mkdir -p tmp/newtiddlers
#rm -f tmp/newtiddlers/*
#node ginsu.js tmp/newcooked.html tmp/newtiddlers || exit 1

# now cook those tiddlers back again with the respective versions of cook
#cook $PWD/test/data/recipes/oldtiddlers.recipe -d $PWD -o tmp/oldrecooked.html || exit 1
#node cook.js $PWD/test/data/recipes/newtiddlers.recipe > tmp/newrecooked.html || exit 1
