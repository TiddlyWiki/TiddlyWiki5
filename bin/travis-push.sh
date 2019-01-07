#!/bin/bash

# Push output back to GitHub


cd output || exit 1

git config --global user.email "travis@travis-ci.org" || exit 1

git config --global user.name "Travis CI" || exit 1

git add -all || exit 1

git commit --message "Travis build: $TRAVIS_BUILD_NUMBER" || exit 1

git remote add deploy "https://$GH_TOKEN@github.com/Jermolene/Testing2019.git" &>/dev/null || exit 1

git push deploy master &>/dev/null || exit 1

cd .. || exit 1
