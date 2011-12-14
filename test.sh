#!/bin/sh

# create a temporary directory if it doesn't already exist
mkdir -p tmp

# cook tiddlywiki 2.6.5 with cook.js
mkdir -p tmp/newcooked
node tiddlywiki.js --recipe $PWD/test/tiddlywiki.2.6.5/source/tiddlywiki.com/index.html.recipe --savewiki tmp/newcooked || exit 1

# compare the two
diff tmp/newcooked/index.html test/tiddlywiki.2.6.5/target/index.2.6.5.html

# Run the wikification tests
node wikitest.js test/wikitests/

jshint *.js
jshint js
