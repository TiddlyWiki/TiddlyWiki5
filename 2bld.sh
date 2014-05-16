#!/bin/bash

# build TiddlyWiki 2.x

# Prepare the readme file from the revelant content in the tw5.com wiki

node ./tiddlywiki.js \
	editions/tw5.com \
	--verbose \
	--output editions/tw2 \
	--rendertiddler TiddlyWiki2ReadMe readme.md text/html \
	|| exit 1

# cook the TiddlyWiki 2.x.x index file

node ./tiddlywiki.js \
	editions/tw2 \
	--verbose \
	--output tmp/tw2 \
	--load editions/tw2/source/tiddlywiki.com/index.html.recipe \
	--rendertiddler $:/core/templates/tiddlywiki2.template.html index.html text/plain \
	|| exit 1

diff -q tmp/tw2/index.html editions/tw2/target/prebuilt.html
