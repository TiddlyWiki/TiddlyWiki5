#!/bin/bash

# Perform a full build for tiddlywiki.com

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

# Delete any existing static content

mkdir -p $TW5_BUILD_OUTPUT/static
mkdir -p $TW5_BUILD_OUTPUT/dev
mkdir -p $TW5_BUILD_OUTPUT/dev/static
rm $TW5_BUILD_OUTPUT/static/*
rm $TW5_BUILD_OUTPUT/dev/static/*

rm $TW5_BUILD_OUTPUT/languages/de_AT/static/*
rm $TW5_BUILD_OUTPUT/languages/de_DE/static/*

# Redirects

echo "<a href='./plugins/tiddlywiki/tw2parser/index.html'>Moved to http://tiddlywiki.com/plugins/tiddlywiki/tw2parser/index.html</a>" > $TW5_BUILD_OUTPUT/classicparserdemo.html
echo "<a href='./plugins/tiddlywiki/codemirror/index.html'>Moved to http://tiddlywiki.com/plugins/tiddlywiki/codemirror/index.html</a>" > $TW5_BUILD_OUTPUT/codemirrordemo.html
echo "<a href='./plugins/tiddlywiki/d3/index.html'>Moved to http://tiddlywiki.com/plugins/tiddlywiki/d3/index.html</a>" > $TW5_BUILD_OUTPUT/d3demo.html
echo "<a href='./plugins/tiddlywiki/highlight/index.html'>Moved to http://tiddlywiki.com/plugins/tiddlywiki/highlight/index.html</a>" > $TW5_BUILD_OUTPUT/highlightdemo.html
echo "<a href='./plugins/tiddlywiki/markdown/index.html'>Moved to http://tiddlywiki.com/plugins/tiddlywiki/markdown/index.html</a>" > $TW5_BUILD_OUTPUT/markdowndemo.html
echo "<a href='./plugins/tiddlywiki/tahoelafs/index.html'>Moved to http://tiddlywiki.com/plugins/tiddlywiki/tahoelafs/index.html</a>" > $TW5_BUILD_OUTPUT/tahoelafs.html

######################################################
#
# Core distribution
#
######################################################

# /index.html			Main site
# /favicon.ico			Favicon for main site
# /empty.html			Empty
# /empty.hta			For Internet Explorer
# /static.html			Static rendering of default tiddlers
# /alltiddlers.html		Static rendering of all tiddlers
# /static/*				Static single tiddlers
# /static/static.css	Static stylesheet
# /static/favicon.ico	Favicon for static pages
node ./tiddlywiki.js \
	./editions/tw5.com \
	--verbose \
	--output . \
	--build readmes \
	--output $TW5_BUILD_OUTPUT \
	--build favicon empty static index \
	|| exit 1

# /dev/index.html			Developer docs
# /dev/favicon.ico			Favicon for dev site
# /dev/static.html			Static rendering of default tiddlers
# /dev/alltiddlers.html		Static rendering of all tiddlers
# /dev/static/*				Static single tiddlers
# /dev/static/static.css	Static stylesheet
node ./tiddlywiki.js \
	./editions/dev \
	--verbose \
	--output $TW5_BUILD_OUTPUT/dev \
	--build index favicon static \
	|| exit 1

# /upgrade.html				Custom edition for performing upgrades
node ./tiddlywiki.js \
	./editions/upgrade \
	--verbose \
	--output $TW5_BUILD_OUTPUT \
	--build upgrade \
	|| exit 1

# /encrypted.html			Copy of the main file encrypted with the password "password"
node ./tiddlywiki.js \
	./editions/tw5.com \
	--verbose \
	--output $TW5_BUILD_OUTPUT \
	--build encrypted \
	|| exit 1

######################################################
#
# Plugin demos
#
######################################################

# /plugins/tiddlywiki/katex/index.html	Demo wiki with KaTeX plugin
# /plugins/tiddlywiki/katex/empty.html	Empty wiki with KaTeX plugin
node ./tiddlywiki.js \
	./editions/katexdemo \
	--verbose \
	--output $TW5_BUILD_OUTPUT \
	--rendertiddler $:/core/save/all plugins/tiddlywiki/katex/index.html text/plain \
	--rendertiddler $:/core/save/empty plugins/tiddlywiki/katex/empty.html text/plain \
	|| exit 1

# /plugins/tiddlywiki/tahoelafs/index.html	Demo wiki with Tahoe-LAFS plugin
# /plugins/tiddlywiki/tahoelafs/empty.html	Empty wiki with Tahoe-LAFS plugin
node ./tiddlywiki.js \
	./editions/tahoelafs \
	--verbose \
	--output $TW5_BUILD_OUTPUT \
	--rendertiddler $:/core/save/all plugins/tiddlywiki/tahoelafs/index.html text/plain \
	--rendertiddler $:/core/save/empty plugins/tiddlywiki/tahoelafs/empty.html text/plain \
	|| exit 1

# /plugins/tiddlywiki/d3/index.html	Demo wiki with D3 plugin
# /plugins/tiddlywiki/d3/empty.html	Empty wiki with D3 plugin
node ./tiddlywiki.js \
	./editions/d3demo \
	--verbose \
	--output $TW5_BUILD_OUTPUT \
	--rendertiddler $:/core/save/all plugins/tiddlywiki/d3/index.html text/plain \
	--rendertiddler $:/core/save/empty plugins/tiddlywiki/d3/empty.html text/plain \
	|| exit 1

# /plugins/tiddlywiki/codemirror/index.html	Demo wiki with codemirror plugin
# /plugins/tiddlywiki/codemirror/empty.html	Empty wiki with codemirror plugin
node ./tiddlywiki.js \
	./editions/codemirrordemo \
	--verbose \
	--output $TW5_BUILD_OUTPUT \
	--rendertiddler $:/core/save/all plugins/tiddlywiki/codemirror/index.html text/plain \
	--rendertiddler $:/core/save/empty plugins/tiddlywiki/codemirror/empty.html text/plain \
	|| exit 1

# /plugins/tiddlywiki/markdown/index.html		Demo wiki with Markdown plugin
# /plugins/tiddlywiki/markdown/empty.html		Empty wiki with Markdown plugin
node ./tiddlywiki.js \
	./editions/markdowndemo \
	--verbose \
	--output $TW5_BUILD_OUTPUT \
	--rendertiddler $:/core/save/all plugins/tiddlywiki/markdown/index.html text/plain \
	--rendertiddler $:/core/save/empty plugins/tiddlywiki/markdown/empty.html text/plain \
	|| exit 1

# /plugins/tiddlywiki/tw2parser/index.html		Demo wiki with tw2parser plugin
# /plugins/tiddlywiki/tw2parser/empty.html		Empty wiki with tw2parser plugin
node ./tiddlywiki.js \
	./editions/classicparserdemo \
	--verbose \
	--output $TW5_BUILD_OUTPUT \
	--rendertiddler $:/core/save/all plugins/tiddlywiki/tw2parser/index.html text/plain \
	--rendertiddler $:/core/save/empty plugins/tiddlywiki/tw2parser/empty.html text/plain \
	|| exit 1

# /plugins/tiddlywiki/highlight/index.html		Demo wiki with highlight plugin
# /plugins/tiddlywiki/highlight/empty.html		Empty wiki with highlight plugin
node ./tiddlywiki.js \
	./editions/highlightdemo \
	--verbose \
	--output $TW5_BUILD_OUTPUT \
	--rendertiddler $:/core/save/all plugins/tiddlywiki/highlight/index.html text/plain \
	--rendertiddler $:/core/save/empty plugins/tiddlywiki/highlight/empty.html text/plain \
	|| exit 1

######################################################
#
# Language editions
#
######################################################

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

# /languages/fr-FR/index.html		Demo wiki with fr-FR language
# /languages/fr-FR/empty.html		Empty wiki with fr-FR language
node ./tiddlywiki.js \
	./editions/fr-FR \
	--verbose \
	--output $TW5_BUILD_OUTPUT \
	--rendertiddler $:/core/save/all languages/fr-FR/index.html text/plain \
	--rendertiddler $:/core/save/empty languages/fr-FR/empty.html text/plain \
	|| exit 1

# /languages/zh-Hans/index.html		Demo wiki with zh-Hans language
# /languages/zh-Hans/empty.html		Empty wiki with zh-Hans language
node ./tiddlywiki.js \
	./editions/zh-Hans \
	--verbose \
	--output $TW5_BUILD_OUTPUT \
	--rendertiddler $:/core/save/all languages/zh-Hans/index.html text/plain \
	--rendertiddler $:/core/save/empty languages/zh-Hans/empty.html text/plain \
	|| exit 1

# /languages/zh-Hant/index.html		Demo wiki with zh-Hant language
# /languages/zh-Hant/empty.html		Empty wiki with zh-Hant language
node ./tiddlywiki.js \
	./editions/zh-Hant \
	--verbose \
	--output $TW5_BUILD_OUTPUT \
	--rendertiddler $:/core/save/all languages/zh-Hant/index.html text/plain \
	--rendertiddler $:/core/save/empty languages/zh-Hant/empty.html text/plain \
	|| exit 1

######################################################
#
# Tests
#
######################################################

# /test.html			Wiki for running tests in browser
# Also runs the serverside tests
node ./tiddlywiki.js \
	./editions/test \
	--verbose \
	--output $TW5_BUILD_OUTPUT \
	--rendertiddler $:/core/save/all test.html text/plain \
	|| exit 1
