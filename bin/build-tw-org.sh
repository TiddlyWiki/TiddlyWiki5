#!/bin/bash

# Build tiddlywiki.org assets.

# Default to the version of TiddlyWiki installed in this repo

if [  -z "$TWORG_BUILD_TIDDLYWIKI" ]; then
    TWORG_BUILD_TIDDLYWIKI=./tiddlywiki.js
fi

echo "Using TWORG_BUILD_TIDDLYWIKI as [$TWORG_BUILD_TIDDLYWIKI]"

# Set up the build details

if [  -z "$TWORG_BUILD_DETAILS" ]; then
    TWORG_BUILD_DETAILS="$(git symbolic-ref --short HEAD)-$(git rev-parse HEAD) from $(git remote get-url origin)"
fi

echo "Using TWORG_BUILD_DETAILS as [$TWORG_BUILD_DETAILS]"

if [  -z "$TWORG_BUILD_COMMIT" ]; then
	TWORG_BUILD_COMMIT="$(git rev-parse HEAD)"
fi

echo "Using TWORG_BUILD_COMMIT as [$TWORG_BUILD_COMMIT]"

# Set up the build output directory

if [  -z "$TWORG_BUILD_OUTPUT" ]; then
    TWORG_BUILD_OUTPUT=$(mktemp -d)
fi

mkdir -p $TWORG_BUILD_OUTPUT

if [  ! -d "$TWORG_BUILD_OUTPUT" ]; then
    echo 'A valid TWORG_BUILD_OUTPUT environment variable must be set'
    exit 1
fi

echo "Using TWORG_BUILD_OUTPUT as [$TWORG_BUILD_OUTPUT]"

# Pull existing GitHub pages content

git clone --depth=1 --branch=main "https://github.com/TiddlyWiki/tiddlywiki.org-gh-pages.git" $TWORG_BUILD_OUTPUT

# Make the CNAME file that GitHub Pages requires

echo "tiddlywiki.org" > $TWORG_BUILD_OUTPUT/CNAME

# Delete any existing static content

mkdir -p $TWORG_BUILD_OUTPUT/static
rm $TWORG_BUILD_OUTPUT/static/*

# Put the build details into a .tid file so that it can be included in each build (deleted at the end of this script)

echo -e -n "title: $:/build\ncommit: $TWORG_BUILD_COMMIT\n\n$TWORG_BUILD_DETAILS\n" > $TWORG_BUILD_OUTPUT/build.tid

######################################################
#
# tiddlywiki.org distribution
#
######################################################

# /index.html			Main site
# /favicon.ico			Favicon for main site
# /static.html			Static rendering of default tiddlers
# /alltiddlers.html		Static rendering of all tiddlers
# /static/*				Static single tiddlers
# /static/static.css	Static stylesheet
# /static/favicon.ico	Favicon for static pages
node $TWORG_BUILD_TIDDLYWIKI \
	editions/tw.org \
	--verbose \
	--version \
	--load $TWORG_BUILD_OUTPUT/build.tid \
	--output $TWORG_BUILD_OUTPUT \
	--build favicon static index \
	|| exit 1

# Delete the temporary build tiddler

rm $TWORG_BUILD_OUTPUT/build.tid || exit 1

# Push output back to GitHub

# Exit script immediately if any command fails
set -e

pushd $TWORG_BUILD_OUTPUT
git config --global user.email "actions@github.com"
git config --global user.name "GitHub Actions"
git add -A .
git commit --message "GitHub build: $GITHUB_RUN_NUMBER of $TW5_BUILD_BRANCH ($(date +'%F %T %Z'))"
git remote add deploy "https://$GH_TOKEN@github.com/TiddlyWiki/tiddlywiki.org-gh-pages.git" &>/dev/null
git push deploy main &>/dev/null
popd
