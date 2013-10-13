#!/bin/bash

# build TiddlyWiki 2.x

# create a temporary directory if it doesn't already exist
mkdir -p tmp
mkdir -p tmp/tw2

# Prepare the readme file from the revelant content in the tw5.com wiki

node bin/tiddlywiki.js \
	editions/tw5.com \
	--verbose \
	--rendertiddler TiddlyWiki2ReadMe editions/tw2/readme.md text/html \
	|| exit 1

# cook the TiddlyWiki 2.x.x index file

node bin/tiddlywiki.js \
	editions/tw2 \
	--verbose \
	--load editions/tw2/source/tiddlywiki.com/index.html.recipe \
	--rendertiddler $:/core/templates/tiddlywiki2.template.html ./tmp/tw2/index.html text/plain \
	|| exit 1

opendiff tmp/tw2/index.html editions/tw2/target/index.2.6.5.html


