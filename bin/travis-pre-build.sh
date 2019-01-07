#!/bin/bash

# Pull existing GitHub pages content

npm --force install tiddlywiki || exit 1

git clone --depth=1 --branch=master "https://github.com/Jermolene/Testing2019.git" output
