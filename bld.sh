#!/bin/bash

# build TiddlyWiki5 for five.tiddlywiki.com

# Set up the build output directory

if [  -z "$TW5_BUILD_OUTPUT" ]; then
    TW5_BUILD_OUTPUT=../jermolene.github.com
fi

if [  ! -d "$TW5_BUILD_OUTPUT" ]; then
    echo 'A valid TW5_BUILD_OUTPUT directory must be set'
    exit 1
fi

echo "Using TW5_BUILD_OUTPUT as [$TW5_BUILD_OUTPUT]"

# Make the CNAME file that GitHub Pages requires

echo "five.tiddlywiki.com" > $TW5_BUILD_OUTPUT/CNAME

# Create the `static` directory if necessary

mkdir -p $TW5_BUILD_OUTPUT/static

# First,
#  readme.md: the readme file for GitHub
#  index.html: the main file, including content
#  static.html: the static version of the default tiddlers

node ./tiddlywiki.js \
	./editions/tw5.com \
	--verbose \
	--savetiddler ReadMe ./readme.md text/html \
	--savetiddler $:/core/templates/tiddlywiki5.template.html $TW5_BUILD_OUTPUT/index.html text/plain \
	--savetiddler $:/core/templates/static.template.html $TW5_BUILD_OUTPUT/static.html text/plain \
	--savetiddler $:/core/templates/static.template.css $TW5_BUILD_OUTPUT/static/static.css text/plain \
	--savetiddlers [!is[shadow]] $:/core/templates/static.tiddler.html $TW5_BUILD_OUTPUT/static text/plain \
	|| exit 1

# Second, encrypted.html: a version of the main file encrypted with the password "password"

node ./tiddlywiki.js \
	./editions/tw5.com \
	--verbose \
	--password password \
	--savetiddler $:/core/templates/tiddlywiki5.template.html $TW5_BUILD_OUTPUT/encrypted.html text/plain \
	|| exit 1

# Third, empty.html: empty wiki for reuse

node ./tiddlywiki.js \
	./editions/empty \
	--verbose \
	--savetiddler $:/core/templates/tiddlywiki5.template.html $TW5_BUILD_OUTPUT/empty.html text/plain \
	|| exit 1

