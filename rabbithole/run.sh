#!/bin/sh

# run TiddlyWiki5

node core/boot.js --verbose --wikitest ../test/wikitests/ --dump shadows || exit 1
