#!/bin/bash

# Process translation updates made via the translators edition

# ./bin/update-translation-from-html-file.sh <language-code> <path-to-html-file>

# Assign and check parameters 

LANGUAGE_CODE=$1 
HTML_FILE_PATH=$2

if [ -z "$LANGUAGE_CODE" ]; then
	echo "Missing parameter: language code"
	exit 1
fi

if [ -z "$HTML_FILE_PATH" ]; then
	echo "Missing parameter: path to HTML file"
	exit 1
fi

./tiddlywiki.js editions/translators/ --verbose --unpackplugin $:/languages/$LANGUAGE_CODE --load $HTML_FILE_PATH --build output-files || exit 1

cp -R ./editions/translators/output/language/. ./languages/$LANGUAGE_CODE/ || exit 1

