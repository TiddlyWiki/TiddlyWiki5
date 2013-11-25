#!/bin/bash

# serve TiddlyWiki5 over HTTP

# Optional parameter is the username for signing edits

node ./tiddlywiki.js \
	editions/clientserver \
	--verbose \
	--server 8080 $:/core/save/all text/plain text/html $1\
	|| exit 1
