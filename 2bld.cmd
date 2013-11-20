@echo off

rem build TiddlyWiki 2.x

rem create a temporary directory if it doesn't already exist
setlocal enableextensions
mkdir tmp\tw2
setlocal disableextensions

rem Delete any existing content

del /q /s tmp\tw2
echo.

rem Prepare the readme file from the revelant content in the tw5.com wiki

node .\tiddlywiki.js ^
	editions\tw5.com ^
	--verbose ^
	--rendertiddler TiddlyWiki2ReadMe editions\tw2\readme.md text/html ^
	|| exit 1

rem cook the TiddlyWiki 2.x.x index file

node .\tiddlywiki.js ^
	editions\tw2 ^
	--verbose ^
	--load editions\tw2\source\tiddlywiki.com\index.html.recipe ^
	--rendertiddler $:/core/templates/tiddlywiki2.template.html .\tmp\tw2\index.html text/plain ^
	|| exit 1

fc tmp\tw2\index.html editions\tw2\target\prebuilt.html
