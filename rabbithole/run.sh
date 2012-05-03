#!/bin/sh

# run TiddlyWiki5

node core/boot.js --verbose --dump shadows || exit 1
