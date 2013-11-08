#!/bin/bash

# test TiddlyWiki5 for five.tiddlywiki.com

# Set up the build output directory

if [  -z "$TW5_BUILD_OUTPUT" ]; then
    TW5_BUILD_OUTPUT=../jermolene.github.com
fi

if [  ! -d "$TW5_BUILD_OUTPUT" ]; then
    echo 'A valid TW5_BUILD_OUTPUT environment variable must be set'
    exit 1
fi

echo "Using TW5_BUILD_OUTPUT as [$TW5_BUILD_OUTPUT]"

# Run the test edition to run the node.js tests and to generate test.html for tests in the browser

node ./tiddlywiki.js \
	./editions/test \
	--verbose \
	--new_rendertiddler $:/core/templates/tiddlywiki5.template.html $TW5_BUILD_OUTPUT/test.html text/plain \
	|| exit 1
