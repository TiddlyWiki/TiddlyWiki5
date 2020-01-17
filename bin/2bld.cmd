@echo off

rem build TiddlyWiki 2.x

rem cook the TiddlyWiki 2.x.x index file

node .\tiddlywiki.js ^
	editions\tw2 ^
	--verbose ^
	--output tmp\tw2 ^
	--load editions\tw2\source\tiddlywiki.com\index.html.recipe ^
	--rendertiddler $:/core/templates/tiddlywiki2.template.html index.html text/plain ^
	|| exit 1

fc tmp\tw2\index.html editions\tw2\target\prebuilt.html
