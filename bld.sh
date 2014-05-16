#!/bin/bash

# build TiddlyWiki5 for tiddlywiki.com

# Set up the build output directory

if [  -z "$TW5_BUILD_OUTPUT" ]; then
    TW5_BUILD_OUTPUT=../jermolene.github.com
fi

if [  ! -d "$TW5_BUILD_OUTPUT" ]; then
    echo 'A valid TW5_BUILD_OUTPUT environment variable must be set'
    exit 1
fi

echo "Using TW5_BUILD_OUTPUT as [$TW5_BUILD_OUTPUT]"

# Make the CNAME file that GitHub Pages requires

echo "tiddlywiki.com" > $TW5_BUILD_OUTPUT/CNAME

# Create the `static` directories if necessary

mkdir -p $TW5_BUILD_OUTPUT/static

# Delete any existing content

rm $TW5_BUILD_OUTPUT/static/*

# The tw5.com wiki
#  index.html: the main file, including content
#  empty.html: the main file, excluding content
#  static.html: the static version of the default tiddlers

node ./tiddlywiki.js \
	./editions/tw5.com \
	--verbose \
	--output $TW5_BUILD_OUTPUT \
	--rendertiddler $:/core/save/all index.html text/plain \
	--savetiddler $:/favicon.ico favicon.ico \
	--rendertiddler ReadMe ./readme.md text/html \
	--rendertiddler ContributingTemplate ./contributing.md text/html \
	--rendertiddler $:/core/copyright.txt ./licenses/copyright.md text/plain \
	--rendertiddler $:/editions/tw5.com/download-empty empty.html text/plain \
	--rendertiddler $:/editions/tw5.com/download-empty empty.hta text/plain \
	--savetiddler $:/green_favicon.ico static/favicon.ico \
	--rendertiddler $:/core/templates/static.template.html static.html text/plain \
	--rendertiddler $:/core/templates/alltiddlers.template.html alltiddlers.html text/plain \
	--rendertiddlers [!is[system]] $:/core/templates/static.tiddler.html static text/plain \
	--rendertiddler $:/core/templates/static.template.css static/static.css text/plain \
	|| exit 1

# encrypted.html: a version of the main file encrypted with the password "password"

node ./tiddlywiki.js \
	./editions/tw5.com \
	--verbose \
	--output $TW5_BUILD_OUTPUT \
	--password password \
	--rendertiddler $:/core/save/all encrypted.html text/plain \
	|| exit 1

# tahoelafs.html: empty wiki with plugin for Tahoe-LAFS

node ./tiddlywiki.js \
	./editions/tahoelafs \
	--verbose \
	--output $TW5_BUILD_OUTPUT \
	--rendertiddler $:/core/save/all tahoelafs.html text/plain \
	|| exit 1

# d3demo.html: wiki to demo d3 plugin

node ./tiddlywiki.js \
	./editions/d3demo \
	--verbose \
	--output $TW5_BUILD_OUTPUT \
	--rendertiddler $:/core/save/all d3demo.html text/plain \
	|| exit 1

# codemirrordemo.html: wiki to demo codemirror plugin

node ./tiddlywiki.js \
	./editions/codemirrordemo \
	--verbose \
	--output $TW5_BUILD_OUTPUT \
	--rendertiddler $:/core/save/all codemirrordemo.html text/plain \
	|| exit 1

# markdowndemo.html: wiki to demo markdown plugin

node ./tiddlywiki.js \
	./editions/markdowndemo \
	--verbose \
	--output $TW5_BUILD_OUTPUT \
	--rendertiddler $:/core/save/all markdowndemo.html text/plain \
	|| exit 1

# highlightdemo.html: wiki to demo highlight plugin

node ./tiddlywiki.js \
	./editions/highlightdemo \
	--verbose \
	--output $TW5_BUILD_OUTPUT \
	--rendertiddler $:/core/save/all highlightdemo.html text/plain \
	|| exit 1

# Run the test edition to run the Node.js tests and to generate test.html for tests in the browser

./test.sh
