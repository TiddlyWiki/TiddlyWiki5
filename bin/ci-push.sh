#!/bin/bash

# Push output back to GitHub

cd output || exit 1
git config --global user.email "actions@github.com" || exit 1
git config --global user.name "GitHub Actions" || exit 1
git add -A . || exit 1
git diff --exit-code || git commit --message "GitHub build: $GITHUB_RUN_NUMBER of $TW5_BUILD_BRANCH ($(date +'%F %T %Z'))" || exit 1
git remote add deploy "https://$GH_TOKEN@github.com/Jermolene/jermolene.github.io.git" || exit 1
git push deploy master || exit 1
cd .. || exit 1
