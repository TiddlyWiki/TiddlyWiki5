#!/bin/bash

# build TiddlyWiki5 for five.tiddlywiki.com

pushd editions/tw5.com > /dev/null

# Set up the build output directory

if [  -z "$TW5_BUILD_OUTPUT" ]; then
    TW5_BUILD_OUTPUT=../../../jermolene.github.com
fi

if [  ! -d "$TW5_BUILD_OUTPUT" ]; then
    echo 'A valid TW5_BUILD_OUTPUT directory must be set'
    exit 1
fi

echo "Using TW5_BUILD_OUTPUT as [$TW5_BUILD_OUTPUT]"

# Make the CNAME file that GitHub Pages requires

echo "five.tiddlywiki.com" > $TW5_BUILD_OUTPUT/CNAME

# First, index.html: the main file, including content

node ../../tiddlywiki.js \
	--verbose \
	--password password \
	--savetiddler ReadMe ../../readme.md text/html \
	--savetiddler $:/core/templates/tiddlywiki5.template.html $TW5_BUILD_OUTPUT/index.html text/plain \
	--savetiddler $:/core/templates/tiddlywiki5.encrypted.template.html $TW5_BUILD_OUTPUT/encrypted.html text/plain \
	--savetiddler $:/core/templates/static.template.html $TW5_BUILD_OUTPUT/static.html text/plain \
	|| exit 1

popd > /dev/null

# Second, empty.html: empty wiki for reuse

pushd editions/empty > /dev/null

node ../../tiddlywiki.js \
	--verbose \
	--password password \
	--savetiddler $:/core/templates/tiddlywiki5.template.html $TW5_BUILD_OUTPUT/empty.html text/plain \
	--savetiddler $:/core/templates/tiddlywiki5.encrypted.template.html $TW5_BUILD_OUTPUT/empty_encrypted.html text/plain \
	|| exit 1

popd > /dev/null
