#!/bin/bash

# serve TiddlyWiki5 over HTTP

node ./tiddlywiki.js \
	editions/tw5.com \
	--verbose \
	--server 8080 $:/core/templates/tiddlywiki5.template.html text/plain text/html \
	|| exit 1
