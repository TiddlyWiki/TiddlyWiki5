#!/bin/bash

# serve TiddlyWiki5 over HTTP

# Optional parameter is the username for signing edits

node ./tiddlywiki.js \
	editions/tw5.com-server \
	--verbose \
	--server 8080 $:/core/save/all text/plain text/html $1 $2\
	|| exit 1
