#!/bin/bash

# Push output back to GitHub

cd output || exit 1

git add -A . || exit 1

git commit --message "Travis build: $TRAVIS_BUILD_NUMBER" || exit 1

git push -q upstream HEAD:master >/dev/null 2>&1 || exit 1

cd .. || exit 1
