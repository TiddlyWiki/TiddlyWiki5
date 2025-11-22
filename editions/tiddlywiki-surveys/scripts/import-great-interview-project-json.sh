#!/bin/bash

# Load the Great Interview Project JSON data into TiddlyWiki and then save it to the specified folder as .tid files
rm -rf ./tmp/2010-great-interview-project
node ./tiddlywiki.js --load ./tmp/2010-great-interview-project.json --savewikifolder ./tmp/2010-great-interview-project

# Copy the tiddlers into this wiki
rm -rf ./editions/tiddlywiki-surveys/tiddlers/2010-great-interview-project
mkdir ./editions/tiddlywiki-surveys/tiddlers/2010-great-interview-project
mkdir ./editions/tiddlywiki-surveys/tiddlers/2010-great-interview-project/text
mkdir ./editions/tiddlywiki-surveys/tiddlers/2010-great-interview-project/images
cp ./tmp/2010-great-interview-project/tiddlers/2010* ./editions/tiddlywiki-surveys/tiddlers/2010-great-interview-project/text
