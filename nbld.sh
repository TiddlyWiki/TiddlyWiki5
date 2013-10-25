#!/bin/bash

# Testing the new widget mechanism

# Set up the build output directory

if [  -z "$TW5_BUILD_OUTPUT" ]; then
    TW5_BUILD_OUTPUT=../jermolene.github.com
fi

if [  ! -d "$TW5_BUILD_OUTPUT" ]; then
    echo 'A valid TW5_BUILD_OUTPUT environment variable must be set'
    exit 1
fi

echo "Using TW5_BUILD_OUTPUT as [$TW5_BUILD_OUTPUT]"

# Build it

node ./tiddlywiki.js \
	./editions/tw5.com \
	--verbose \
	--new_rendertiddler $:/core/templates/tiddlywiki5.template.html $TW5_BUILD_OUTPUT/index.html text/plain \
	--new_rendertiddler ReadMe ./readme.md text/html \
	--new_rendertiddler ContributingTemplate ./contributing.md text/html \
	--new_rendertiddler $:/core/templates/static.template.html $TW5_BUILD_OUTPUT/static.html text/plain \
	--new_rendertiddler $:/core/templates/static.template.css $TW5_BUILD_OUTPUT/static/static.css text/plain \
	--new_rendertiddlers [!is[system]] $:/core/templates/static.tiddler.html $TW5_BUILD_OUTPUT/static text/plain \
	|| exit 1

# Second, encrypted.html: a version of the main file encrypted with the password "password"

node ./tiddlywiki.js \
	./editions/tw5.com \
	--verbose \
	--password password \
	--new_rendertiddler $:/core/templates/tiddlywiki5.template.html $TW5_BUILD_OUTPUT/encrypted.html text/plain \
	|| exit 1

# Fifth, d3demo.html: wiki to demo d3 plugin

node ./tiddlywiki.js \
	./editions/d3demo \
	--verbose \
	--new_rendertiddler $:/core/templates/tiddlywiki5.template.html $TW5_BUILD_OUTPUT/d3demo.html text/plain \
	|| exit 1

# Seventh, codemirrordemo.html: wiki to demo codemirror plugin

node ./tiddlywiki.js \
	./editions/codemirrordemo \
	--verbose \
	--new_rendertiddler $:/core/templates/tiddlywiki5.template.html $TW5_BUILD_OUTPUT/codemirrordemo.html text/plain \
	|| exit 1

# cook the TiddlyWiki 2.x.x index file

node ./tiddlywiki.js \
	editions/tw2 \
	--verbose \
	--load editions/tw2/source/tiddlywiki.com/index.html.recipe \
	--new_rendertiddler $:/core/templates/tiddlywiki2.template.html ./tmp/tw2/index.html text/plain \
	|| exit 1

opendiff tmp/tw2/index.html editions/tw2/target/pre-widgetredux2.html

# Run tests

./test.sh
