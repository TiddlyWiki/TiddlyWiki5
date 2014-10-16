@echo off

rem test TiddlyWiki5 for tiddlywiki.com

rem Run the test edition to run the node.js tests and to generate test.html for tests in the browser

node .\tiddlywiki.js ^
	.\editions\test ^
	--verbose ^
	--rendertiddler $:/core/save/all test.html text/plain ^
	|| exit 1
