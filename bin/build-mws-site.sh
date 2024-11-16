#!/bin/bash

# Build mws.tiddlywiki.com assets.

# Default to the version of TiddlyWiki installed in this repo

if [  -z "$MWSTWCOM_BUILD_TIDDLYWIKI" ]; then
    MWSTWCOM_BUILD_TIDDLYWIKI=./tiddlywiki.js
fi

echo "Using MWSTWCOM_BUILD_TIDDLYWIKI as [$MWSTWCOM_BUILD_TIDDLYWIKI]"

# Set up the build details

if [  -z "$MWSTWCOM_BUILD_DETAILS" ]; then
    MWSTWCOM_BUILD_DETAILS="$(git symbolic-ref --short HEAD)-$(git rev-parse HEAD) from $(git remote get-url origin)"
fi

echo "Using MWSTWCOM_BUILD_DETAILS as [$MWSTWCOM_BUILD_DETAILS]"

if [  -z "$MWSTWCOM_BUILD_COMMIT" ]; then
	MWSTWCOM_BUILD_COMMIT="$(git rev-parse HEAD)"
fi

echo "Using MWSTWCOM_BUILD_COMMIT as [$MWSTWCOM_BUILD_COMMIT]"

# Set up the build output directory

if [  -z "$MWSTWCOM_BUILD_OUTPUT" ]; then
    MWSTWCOM_BUILD_OUTPUT=$(mktemp -d)
fi

mkdir -p $MWSTWCOM_BUILD_OUTPUT

if [  ! -d "$MWSTWCOM_BUILD_OUTPUT" ]; then
    echo 'A valid MWSTWCOM_BUILD_OUTPUT environment variable must be set'
    exit 1
fi

echo "Using MWSTWCOM_BUILD_OUTPUT as [$MWSTWCOM_BUILD_OUTPUT]"

# Pull existing GitHub pages content

git clone --depth=1 --branch=main "https://github.com/TiddlyWiki/mws.tiddlywiki.com-gh-pages.git" $MWSTWCOM_BUILD_OUTPUT

# Make the CNAME file that GitHub Pages requires

echo "mws.tiddlywiki.com" > $MWSTWCOM_BUILD_OUTPUT/CNAME

# Delete any existing static content

mkdir -p $MWSTWCOM_BUILD_OUTPUT/static
rm $MWSTWCOM_BUILD_OUTPUT/static/*

# Put the build details into a .tid file so that it can be included in each build (deleted at the end of this script)

echo -e -n "title: $:/build\ncommit: $MWSTWCOM_BUILD_COMMIT\n\n$MWSTWCOM_BUILD_DETAILS\n" > $MWSTWCOM_BUILD_OUTPUT/build.tid

######################################################
#
# mws.tiddlywiki.com distribution
#
######################################################

# /index.html			Main site
# /favicon.ico			Favicon for main site
# /static.html			Static rendering of default tiddlers
# /alltiddlers.html		Static rendering of all tiddlers
# /static/*				Static single tiddlers
# /static/static.css	Static stylesheet
# /static/favicon.ico	Favicon for static pages
node $MWSTWCOM_BUILD_TIDDLYWIKI \
	editions/multiwikidocs \
	--verbose \
	--version \
	--load $MWSTWCOM_BUILD_OUTPUT/build.tid \
	--output $MWSTWCOM_BUILD_OUTPUT \
	--build favicon static index \
	|| exit 1

# Delete the temporary build tiddler

rm $MWSTWCOM_BUILD_OUTPUT/build.tid || exit 1

# Push output back to GitHub

# Exit script immediately if any command fails
set -e

pushd $MWSTWCOM_BUILD_OUTPUT
git config --global user.email "actions@github.com"
git config --global user.name "GitHub Actions"
git add -A .
git commit --message "GitHub build: $GITHUB_RUN_NUMBER of $TW5_BUILD_BRANCH ($(date +'%F %T %Z'))"
git remote add deploy "https://$GH_TOKEN@github.com/TiddlyWiki/mws.tiddlywiki.com-gh-pages.git" &>/dev/null
git push deploy main &>/dev/null
popd
