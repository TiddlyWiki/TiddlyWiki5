#!/bin/bash

# Deploy latest build to github

# This deployment script needs several improvements:

# 1) deploying to NPM
# 2) deploying to TiddlySpace

pushd ../jermolene.github.com

git add --all || exit 1

git commit -m "Updates" || exit 1

git push origin || exit 1

popd
