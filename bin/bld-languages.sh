#!/bin/bash

# Abbreviated version of bld.sh for quicker builds

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

# The tw5.com wiki
#  index.html: the main file, including content

# /languages/de-AT/index.html		Demo wiki with de-AT language
# /languages/de-AT/empty.html		Empty wiki with de-AT language
node ./tiddlywiki.js \
	./editions/de-AT \
	--verbose \
	--output $TW5_BUILD_OUTPUT/languages/de-AT \
	--build favicon empty static index \
	|| exit 1

# /languages/de-DE/index.html		Demo wiki with de-DE language
# /languages/de-DE/empty.html		Empty wiki with de-DE language
node ./tiddlywiki.js \
	./editions/de-DE \
	--verbose \
	--output $TW5_BUILD_OUTPUT/languages/de-DE \
	--build favicon empty static index \
	|| exit 1

