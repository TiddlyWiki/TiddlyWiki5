#!/bin/bash

# build TiddlyWiki5 for five.tiddlywiki.com

# First, index.html: the main file, including content

pushd editions/tw5.com > /dev/null

if [  -z "$JERMOLENE_HOME" ]; then
    JERMOLENE_HOME=../../../jermolene.github.com
fi

if [  ! -d "$JERMOLENE_HOME" ]; then
    echo 'A valid JERMOLENE_HOME directory must be set'
    exit 1
fi

echo "Using JERMOLENE_HOME as [$JERMOLENE_HOME]"
echo "five.tiddlywiki.com" > $JERMOLENE_HOME/CNAME

node ../../tiddlywiki.js \
	--verbose \
	--password password \
	--savetiddler ReadMe ../../readme.md text/html \
	--savetiddler $:/core/templates/tiddlywiki5.template.html $JERMOLENE_HOME/index.html text/plain \
	--savetiddler $:/core/templates/tiddlywiki5.encrypted.template.html $JERMOLENE_HOME/encrypted.html text/plain \
	--savetiddler $:/core/templates/static.template.html $JERMOLENE_HOME/static.html text/plain \
	|| exit 1

popd > /dev/null

# Second, empty.html: empty wiki for reuse

pushd editions/empty > /dev/null

node ../../tiddlywiki.js \
	--verbose \
	--password password \
	--savetiddler $:/core/templates/tiddlywiki5.template.html $JERMOLENE_HOME/empty.html text/plain \
	--savetiddler $:/core/templates/tiddlywiki5.encrypted.template.html $JERMOLENE_HOME/empty_encrypted.html text/plain \
	|| exit 1

popd > /dev/null
