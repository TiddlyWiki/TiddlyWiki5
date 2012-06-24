#!/bin/bash

# Build TiddlyWiki's CSS from source

recess --compile ./cssbuild/tiddlywiki.less > ./core/styles/tiddlywiki.css | exit

# Call bld.sh to build TiddlyWiki

./bld.sh
