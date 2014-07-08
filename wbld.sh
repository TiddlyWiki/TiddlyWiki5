#!/bin/bash

# build the TiddlyWeb edition of TiddlyWiki5

# usage:
# ./wbld.sh

# Create the tmp directory if needed

mkdir -p tmp

# Open the tw5tiddlyweb edition in TW5 and save the template for the main HTML file

node ./tiddlywiki.js \
	editions/tw5tiddlyweb \
	--verbose \
	--output tmp \
	--rendertiddler $:/core/save/all tiddlyweb.html text/plain \
	|| exit 1

# Prepend the type information that TiddlyWeb needs to turn the .html file into a .tid file

echo "type: text/html" > tmp/app.tid
echo "" >> tmp/app.tid
cat tmp/tiddlyweb.html >> tmp/app.tid
