#!/bin/bash

# test TiddlyWiki5 for tiddlywiki.com

# Run the test edition to run the node.js tests and to generate test.html for tests in the browser

node ./tiddlywiki.js \
	./editions/test \
	--verbose \
	--version \
	--rendertiddler $:/core/save/all test.html text/plain \
	--test \
	|| exit 1

echo To run the tests in a browser, open "editions/test/output/test.html"
