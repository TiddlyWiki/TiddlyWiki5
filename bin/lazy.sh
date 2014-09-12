#!/bin/bash

# serve TiddlyWiki5 over HTTP with lazily loaded images

# Optional parameter is the username for signing edits

node ./tiddlywiki.js \
	editions/server \
	--verbose \
	--server 8080 $:/core/save/lazy-images text/plain text/html $1 $2\
	|| exit 1
