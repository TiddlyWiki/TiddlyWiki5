#!/bin/bash

# test TiddlyWiki5 for tiddlywiki.com

npm install playwright @playwright/test
npx playwright install chromium firefox --with-deps

node ./tiddlywiki.js \
	./editions/test \
	--verbose \
	--version \
	--rendertiddler $:/core/save/all test.html text/plain \
	--test \
	|| exit 1

npx playwright test
