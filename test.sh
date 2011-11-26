#!/bin/sh

# create a temporary directory if it doesn't already exist
mkdir -p tmp

# cook the recipe with the old cook.rb (assuming you have set it up as described in github.com/TiddlyWiki/cooker)
cook $PWD/test/data/tiddlywiki.com/index.html.recipe -d $PWD -o tmp/oldcooked.html || exit 1

# cook it with cook.js
node cook.js $PWD/test/data/tiddlywiki.com/index.html.recipe > tmp/newcooked.html || exit 1

# compare the two
#opendiff tmp/oldcooked.html tmp/newcooked.html

# split the newly cooked tiddlywiki into tiddlers, first with the new ginsu
mkdir -p tmp/newtiddlers
rm -f tmp/newtiddlers/*
node ginsu.js tmp/newcooked.html tmp/newtiddlers

# and now cook them with the old
rm -r tmp/oldtiddlers
ginsu tmp/oldcooked
mv oldcooked.html.0 tmp/oldtiddlers/
