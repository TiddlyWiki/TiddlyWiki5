#!/bin/bash

# build TiddlyWiki5

pushd editions/tw5.com > /dev/null

echo "five.tiddlywiki.com" > ../../../jermolene.github.com/CNAME

node ../../core/boot.js \
	--verbose \
	--password password \
	--savetiddler ReadMe ../../readme.md text/html \
	--savetiddler $:/core/templates/tiddlywiki5.template.html ../../../jermolene.github.com/index.html text/plain [!is[shadow]]\
	--savetiddler $:/core/templates/tiddlywiki5.template.html ../../../jermolene.github.com/empty.html text/plain [!is[shadow]is[shadow]]\
	--savetiddler $:/core/templates/tiddlywiki5.encrypted.template.html ../../../jermolene.github.com/encrypted.html text/plain [!is[shadow]]\
	--savetiddler $:/core/templates/static.template.html ../../../jermolene.github.com/static.html text/plain \
	|| exit 1

popd > /dev/null
