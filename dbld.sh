#!/bin/bash

# build TiddlyWiki5 in the Sky for Dropbox

pushd tw5dropbox > /dev/null

node ../core/boot.js \
	--verbose \
	--savetiddler $:/core/templates/tw5dropbox.template.html ../../../../Apps/Static\ Web\ Apps/TiddlyWiki5/public/index.html text/plain [!is[shadow]] \
	|| exit 1

popd > /dev/null
