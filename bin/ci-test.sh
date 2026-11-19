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

# Run the full Jasmine page alone: it contains thousands of specs and should
# not compete with other wiki pages for a shared runner's CPU and memory.
npx playwright test editions/test/playwright.spec.js --project=chromium --workers=1 || exit 1

# Run the rest of the Playwright suite once in Chromium. The ProseMirror suite is
# substantial, and running every editor behaviour test across all browser
# projects makes PR CI extremely slow while mostly retesting editor model logic.
npx playwright test --project=chromium --workers=2 --grep-invert @full-jasmine || exit 1

# Keep cross-browser coverage focused on the full TiddlyWiki browser test page,
# command menu layout and ProseMirror smoke/installation/clipboard tests.
# Full Firefox/Edge runs are still available locally with
# `npx playwright test --project=firefox` or `--project=edge`.
npx playwright test editions/test/playwright.spec.js --project=firefox --workers=1 || exit 1

npx playwright test \
	editions/test \
	plugins/tiddlywiki/editor-command-menu/tests/menu-view.spec.js \
	plugins/tiddlywiki/prosemirror/tests/smoke.spec.js \
	plugins/tiddlywiki/prosemirror/tests/specs/installation.spec.js \
	plugins/tiddlywiki/prosemirror/tests/specs/core-compatibility.spec.js \
	plugins/tiddlywiki/prosemirror/tests/specs/clipboard.spec.js \
	plugins/tiddlywiki/prosemirror/tests/specs/code-delimiters.spec.js \
	--project=firefox \
	--grep-invert @full-jasmine \
	--workers=2
