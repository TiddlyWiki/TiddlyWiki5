#!/bin/bash

# Install latest current release from npm
# (we need to force because otherwise npm will refuse to install a module of the same name)

npm --force install tiddlywiki || exit 1

# Pull existing GitHub pages content

git clone --depth=1 --branch=master "https://github.com/TiddlyWiki/tiddlywiki.com-gh-pages.git" output
