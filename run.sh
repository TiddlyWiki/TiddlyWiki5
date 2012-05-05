#!/bin/sh

# run TiddlyWiki5

pushd tw5.com > /dev/null

node ../core/boot.js \
	--verbose \
	--wikitest ../tests/wikitests/ \
	|| exit 1

popd > /dev/null

# run jshint
jshint ./core/*.js
jshint ./core/modules/*.js
jshint ./core/modules/commands/*.js
jshint ./core/modules/macros/*.js
jshint ./core/modules/macros/edit/*.js
jshint ./core/modules/macros/edit/editors/*.js
jshint ./core/modules/parsers/*.js
jshint ./core/modules/parsers/wikitextparser/*.js
jshint ./core/modules/parsers/wikitextparser/rules/*.js
jshint ./core/modules/treenodes/*.js
