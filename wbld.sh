#!/bin/bash

# build the TiddlyWeb edition of TiddlyWiki5 and upload to TiddlySpace

# usage:
# ./wbld.sh <tiddlyspace username> <tiddlyspace password>

pushd editions/tw5tiddlyweb > /dev/null

node ../../core/boot.js \
	--verbose \
	--savetiddler $:/core/templates/tiddlywiki5.template.html ../../../jermolene.github.com/tiddlyweb.html text/plain \
	|| exit 1

popd > /dev/null

mkdir -p tmp
echo "type: text/html" > tmp/tmp.txt
echo "" >> tmp/tmp.txt
cat ../jermolene.github.com/tiddlyweb.html >> tmp/tmp.txt

curl -u $1:$2 -X PUT -H "content-type: text/plain" http://tw5tiddlyweb.tiddlyspace.com/bags/tw5tiddlyweb_public/tiddlers/tw5tiddlyweb --data-binary @tmp/tmp.txt
