#!/bin/bash

# Pull existing GitHub pages content

npm --force install tiddlywiki || exit 1

mkdir -p output || exit 1

cd output || exit 1

git init || exit 1

git config --global user.email "travis@travis-ci.org" || exit 1

git config --global user.name "Travis CI" || exit 1

git remote add upstream "https://$GH_TOKEN@github.com/Jermolene/Testing2019.git" || exit 1

git fetch upstream || exit 1

git reset upstream/master || exit 1

cd .. || exit 1
