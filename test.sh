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
node ginsu.js tmp/newcooked.html tmp/newtiddlers || exit 1

# and now ginsu them with the old ginsu.rb
rm -r tmp/oldtiddlers
ginsu tmp/oldcooked || exit 1
mv oldcooked.html.0 tmp/oldtiddlers/

# now cook those tiddlers back again with the respective versions of cook
#cook $PWD/test/data/recipes/oldtiddlers.recipe -d $PWD -o tmp/oldrecooked.html || exit 1
node cook.js $PWD/test/data/recipes/newtiddlers.recipe > tmp/newrecooked.html || exit 1
