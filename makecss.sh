#!/bin/bash

# Build TiddlyWiki's CSS from source

recess --compile ./cssbuild/tiddlywiki.less > ./core/styles/tiddlywiki.css | exit

recess --compile ./cssbuild/twitter-bootstrap/less/responsive.less > ./core/styles/bootstrap-responsive.css | exit

# Call bld.sh to build TiddlyWiki

./bld.sh
