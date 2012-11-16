#!/bin/bash

# serve TiddlyWiki5 over HTTP

pushd editions/tw5.com > /dev/null

node ../../core/boot.js \
	--verbose \
	--server 8080 $:/core/templates/tiddlywiki5.template.html text/plain text/html \
	|| exit 1

popd > /dev/null
