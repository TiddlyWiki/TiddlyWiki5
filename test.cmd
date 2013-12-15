@echo off

rem test TiddlyWiki5 for tiddlywiki.com

rem Set up the build output directory

if "x%TW5_BUILD_OUTPUT%" == "x" (
	set TW5_BUILD_OUTPUT=..\jermolene.github.com
)

if not exist %TW5_BUILD_OUTPUT%\nul (
	echo A valid TW5_BUILD_OUTPUT environment variable must be set
	exit 1
)

echo Using TW5_BUILD_OUTPUT as %TW5_BUILD_OUTPUT%

rem Run the test edition to run the node.js tests and to generate test.html for tests in the browser

node .\tiddlywiki.js ^
	.\editions\test ^
	--verbose ^
	--rendertiddler $:/core/save/all %TW5_BUILD_OUTPUT%\test.html text/plain ^
	|| exit 1
