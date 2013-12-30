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

	--savetiddler $:/green_favicon.ico $TW5_BUILD_OUTPUT/static/favicon.ico \
	--rendertiddler $:/core/templates/alltiddlers.template.html $TW5_BUILD_OUTPUT/alltiddlers.html text/plain \


# codemirrordemo.html: wiki to demo codemirror plugin

node ./tiddlywiki.js \
	./editions/ckeditordemo \
	--verbose \
	--rendertiddler $:/core/save/all $TW5_BUILD_OUTPUT/ckeditor.html text/plain \
	|| exit 1


