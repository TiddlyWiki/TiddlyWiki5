#!/usr/bin/env bash

# Build version of TiddlyWiki with external javascript
# Usage:
#  bldxjs [release]

DEFAULT_RELEASE=2.6.3.A2
RELEASE=${1:-$DEFAULT_RELEASE}
DEST=$PWD
RECIPE=$PWD/tiddlywiki.html.recipe
RECIPE_EXT_JS=$PWD/tiddlywiki_externaljs.html.recipe
RECIPE_EXT_JS_TS=$PWD/tiddlywiki_externaljs_tiddlyspace_alpha.html.recipe
ruby -Ku -C ../tools/cooker cook.rb $RECIPE -d$DEST -q -j -o twcore.$RELEASE.js $2 $3 $4 $5
cp -f twcore.$RELEASE.js twcore.js
cp -f jquery/jquery.js jquery.js
cp -f jquery/plugins/jQuery.twStylesheet.js jQuery.twStylesheet.js
ruby -Ku -C ../tools/cooker cook.rb $RECIPE_EXT_JS -d$DEST -q -o tiddlywiki_externaljs.$RELEASE.html$2 $3 $4 $5
ruby -Ku -C ../tools/cooker cook.rb $RECIPE_EXT_JS_TS -d$DEST -q -o tiddlywiki_externaljs_tiddlyspace.$RELEASE.html$2 $3 $4 $5
