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

# Run tests

./test.sh
