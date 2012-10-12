#!/bin/bash

# build TiddlyWiki5 in the Sky for Dropbox

pushd tw5dropbox/appwiki > /dev/null

node ../../core/boot.js \
	--verbose \
	--savetiddler $:/core/templates/tw5dropbox.template.js ../../../../../Apps/Static\ Web\ Apps/TiddlyWiki5/public/tw5dropbox.js text/plain [!is[shadow]] \
	--savetiddler $:/core/templates/index.template.html ../../../../../Apps/TiddlyWiki5/My\ TiddlyWiki/index.html text/plain [!is[shadow]] \
	--savetiddler $:/core/templates/index.template.html ../../../../../Apps/Static\ Web\ Apps/TiddlyWiki5/public/apptemplate.html text/plain [!is[shadow]] \
	--savetiddler $:/core/templates/styles.template.css ../../../../../Apps/Static\ Web\ Apps/TiddlyWiki5/public/styles.css text/plain [!is[shadow]] \
	|| exit 1

popd > /dev/null

pushd tw5dropbox/mainwiki > /dev/null

node ../../core/boot.js \
	--verbose \
	--savetiddler $:/core/templates/index.template.html ../../../../../Apps/Static\ Web\ Apps/TiddlyWiki5/public/index.html text/plain [!is[shadow]] \
	|| exit 1

popd > /dev/null
