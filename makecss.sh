#!/bin/bash

# Build TiddlyWiki's CSS from source

recess --compile --compress ./cssbuild/tiddlywiki.less > ./core/styles/tiddlywiki.css

# Call bld.sh to build TiddlyWiki

./bld.sh
