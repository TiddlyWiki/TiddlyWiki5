#!/bin/bash

# build the Tank edition of TiddlyWiki

# See https://tank.peermore.com

# Open the tank edition in TW5 and save the template for the main HTML file

node ./tiddlywiki.js \
	editions/tw5tank \
	--verbose \
	--output tmp \
	--rendertiddler $:/core/save/all app.html text/plain \
	|| exit 1

# Prepend the type information that TiddlyWeb needs to turn the .html file into a .tid file

echo "type: text/html" > tmp/app.txt
echo "" >> tmp/app.txt
cat tmp/app.html >> tmp/app.txt
