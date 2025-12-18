#!/bin/bash

# Push output back to GitHub

# Exit script immediately if any command fails
set -e

cd output
git config --global user.email "actions@github.com"
git config --global user.name "GitHub Actions"
git add -A .
git commit --message "GitHub build: $GITHUB_RUN_NUMBER of $TW5_BUILD_BRANCH ($(date +'%F %T %Z'))"
git remote add deploy "https://$GH_TOKEN@github.com/TiddlyWiki/tiddlywiki.com-gh-pages.git" &>/dev/null
git push deploy master &>/dev/null
cd ..
