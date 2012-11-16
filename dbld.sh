#!/bin/bash

# build TiddlyWiki5 in the Sky for Dropbox

# Copy the dummy content

rm ../../../Apps/TiddlyWiki5/My\ TiddlyWiki/tiddlers/*.*
cp tw5dropbox/dummycontent/*.* ../../../Apps/TiddlyWiki5/My\ TiddlyWiki/tiddlers

# Build the app wiki

pushd editions/tw5dropbox/appwiki > /dev/null

node ../../../core/boot.js \
	--verbose \
	--savetiddler $:/plugins/dropbox/tw5dropbox.template.js ../../../../../../Apps/Static\ Web\ Apps/TiddlyWiki5/public/tw5dropbox.js text/plain \
	--savetiddler $:/plugins/dropbox/index.template.html ../../../../../../Apps/TiddlyWiki5/My\ TiddlyWiki/index.html text/plain \
	--savetiddler $:/plugins/dropbox/index.template.html ../../../../../../Apps/Static\ Web\ Apps/TiddlyWiki5/public/apptemplate.html text/plain \
	--savetiddler $:/plugins/dropbox/styles.template.css ../../../../../../Apps/Static\ Web\ Apps/TiddlyWiki5/public/styles.css text/plain \
	|| exit 1

popd > /dev/null

# Build the main wiki

pushd editions/tw5dropbox/mainwiki > /dev/null

node ../../../core/boot.js \
	--verbose \
	--savetiddler $:/plugins/dropbox/index.template.html ../../../../../../Apps/Static\ Web\ Apps/TiddlyWiki5/public/index.html text/plain \
	|| exit 1

popd > /dev/null
