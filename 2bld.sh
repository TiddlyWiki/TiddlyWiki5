#!/bin/bash

# build TiddlyWiki 2.x

# create a temporary directory if it doesn't already exist
mkdir -p tmp
mkdir -p tmp/tw2

# Prepare the readme file from the revelant content in the tw5.com content

pushd editions/tw5.com > /dev/null

node ../../tiddlywiki.js \
	--verbose \
	--savetiddler TiddlyWiki2ReadMe ../tw2/readme.md text/html \
	|| exit 1

popd > /dev/null

# cook the TiddlyWiki 2.x.x index file

pushd editions/tw2 > /dev/null

node ../../tiddlywiki.js \
	--verbose \
	--load source/tiddlywiki.com/index.html.recipe \
	--savetiddler $:/core/templates/tiddlywiki2.template.html ../../tmp/tw2/index.html text/plain \
	|| exit 1

popd > /dev/null

opendiff tmp/tw2/index.html editions/tw2/target/index.2.6.5.html
