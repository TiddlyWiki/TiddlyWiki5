#!/bin/bash

# test TiddlyWiki5 for tiddlywiki.com

node ./tiddlywiki.js \
	./editions/test \
	--verbose \
	--version \
	--rendertiddler $:/core/save/all test.html text/plain \
	--test \
	|| exit 1

npm install playwright @playwright/test
npx playwright install chromium firefox --with-deps

npx playwright test
