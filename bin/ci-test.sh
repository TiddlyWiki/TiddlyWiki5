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

# Run the full Playwright suite once in Chromium. The ProseMirror suite is
# substantial, and running every editor behaviour test across all browser
# projects makes PR CI extremely slow while mostly retesting editor model logic.
npx playwright test --project=chromium || exit 1

# Keep cross-browser coverage focused on the full TiddlyWiki browser test page
# and ProseMirror smoke tests. Full Firefox/Edge runs are still available
# locally with `npx playwright test --project=firefox` or `--project=edge`.
npx playwright test \
	editions/test \
	plugins/tiddlywiki/prosemirror/tests/smoke.spec.js \
	--project=firefox \
	--project=edge
