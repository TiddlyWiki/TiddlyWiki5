#!/bin/sh

# cook the recipe with the old cook.rb (assuming you have set it up as described in github.com/TiddlyWiki/cooker)
cook $PWD/test/data/tiddlywiki.com/index.html.recipe -d $PWD -o oldcooked.html

# cook it with cook.js
node cook.js $PWD/test/data/tiddlywiki.com/index.html.recipe > newcooked.html

# compare the two
opendiff oldcooked.html newcooked.html
