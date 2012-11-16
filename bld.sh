#!/bin/bash

# build TiddlyWiki5 for five.tiddlywiki.com

# First, index.html: the main file, including content

pushd editions/tw5.com > /dev/null

echo "five.tiddlywiki.com" > ../../../jermolene.github.com/CNAME

node ../../core/boot.js \
	--verbose \
	--password password \
	--savetiddler ReadMe ../../readme.md text/html \
	--savetiddler $:/core/templates/tiddlywiki5.template.html ../../../jermolene.github.com/index.html text/plain \
	--savetiddler $:/core/templates/tiddlywiki5.encrypted.template.html ../../../jermolene.github.com/encrypted.html text/plain \
	--savetiddler $:/core/templates/static.template.html ../../../jermolene.github.com/static.html text/plain \
	|| exit 1

popd > /dev/null

# Second, empty.html: empty wiki for reuse

pushd editions/empty > /dev/null

node ../../core/boot.js \
	--verbose \
	--password password \
	--savetiddler $:/core/templates/tiddlywiki5.template.html ../../../jermolene.github.com/empty.html text/plain \
	--savetiddler $:/core/templates/tiddlywiki5.encrypted.template.html ../../../jermolene.github.com/empty_encrypted.html text/plain \
	|| exit 1

popd > /dev/null
