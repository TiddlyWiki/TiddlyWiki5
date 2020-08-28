#!/bin/bash

# Push output back to GitHub


cd output || exit 1

git config --global user.email "actions@github.com" || exit 1

git config --global user.name "GitHub Actions" || exit 1

git add -A . || exit 1

git commit --message "GitHub build: $TRAVIS_BUILD_NUMBER of $TRAVIS_BRANCH ($(date +'%F %T %Z'))" || exit 1

git remote add deploy "https://$GH_TOKEN@github.com/Jermolene/jermolene.github.io.git" &>/dev/null || exit 1

git push deploy master &>/dev/null || exit 1

cd .. || exit 1
