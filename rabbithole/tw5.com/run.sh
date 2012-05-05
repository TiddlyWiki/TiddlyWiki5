#!/bin/sh

# run TiddlyWiki5

node ../core/boot.js --verbose --wikitest ../../test/wikitests/ || exit 1

node ../core/boot.js --verbose --savetiddler $:/core/tiddlywiki5.template.html ../tmp/tw5/rabbit.html text/plain || exit 1

# run jshint
jshint ../core/*.js
jshint ../core/modules/*.js
jshint ../core/modules/commands/*.js
jshint ../core/modules/macros/*.js
jshint ../core/modules/macros/edit/*.js
jshint ../core/modules/macros/edit/editors/*.js
jshint ../core/modules/parsers/*.js
jshint ../core/modules/parsers/wikitextparser/*.js
jshint ../core/modules/parsers/wikitextparser/rules/*.js
jshint ../core/modules/treenodes/*.js
