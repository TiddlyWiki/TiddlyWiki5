@echo off

rem build TiddlyWiki5 for tiddlywiki.com

rem Set up the build output directory

if "x%TW5_BUILD_OUTPUT%" == "x" (
	set TW5_BUILD_OUTPUT=..\jermolene.github.com
)

if not exist %TW5_BUILD_OUTPUT%\nul (
	echo A valid TW5_BUILD_OUTPUT environment variable must be set
	exit 1
)

echo Using TW5_BUILD_OUTPUT as %TW5_BUILD_OUTPUT%
echo.

rem Create the `static` directories if necessary

setlocal enableextensions
mkdir %TW5_BUILD_OUTPUT%\static
setlocal disableextensions

rem Delete any existing content

del /q /s %TW5_BUILD_OUTPUT%\static

rem The tw5.com wiki
rem  index.html: the main file, including content
rem  empty.html: the main file, excluding content
rem  static.html: the static version of the default tiddlers

node .\tiddlywiki.js ^
	.\editions\tw5.com ^
	--verbose ^
	--output . ^
	--build readmes ^
	--output %TW5_BUILD_OUTPUT% ^
	--build favicon empty static index ^
	|| exit 1

rem upgrade.html: custom edition for handling upgrades

node .\tiddlywiki.js ^
	.\editions\upgrade ^
	--verbose ^
	--output %TW5_BUILD_OUTPUT% ^
	--build upgrade ^
	|| exit 1

rem encrypted.html: a version of the main file encrypted with the password "password"

node .\tiddlywiki.js ^
	.\editions\tw5.com ^
	--verbose ^
	--output %TW5_BUILD_OUTPUT% ^
	--build encrypted ^
	|| exit 1

rem tahoelafs.html: empty wiki with plugin for Tahoe-LAFS

node .\tiddlywiki.js ^
	.\editions\tahoelafs ^
	--verbose ^
	--output %TW5_BUILD_OUTPUT% ^
	--rendertiddler $:/core/save/all tahoelafs.html text/plain ^
	|| exit 1

rem d3demo.html: wiki to demo d3 plugin

node .\tiddlywiki.js ^
	.\editions\d3demo ^
	--verbose ^
	--output %TW5_BUILD_OUTPUT% ^
	--rendertiddler $:/core/save/all d3demo.html text/plain ^
	|| exit 1

rem codemirrordemo.html: wiki to demo codemirror plugin

node .\tiddlywiki.js ^
	.\editions\codemirrordemo ^
	--verbose ^
	--output %TW5_BUILD_OUTPUT% ^
	--rendertiddler $:/core/save/all codemirrordemo.html text/plain ^
	|| exit 1

rem markdowndemo.html: wiki to demo markdown plugin

node .\tiddlywiki.js ^
	.\editions\markdowndemo ^
	--verbose ^
	--output %TW5_BUILD_OUTPUT% ^
	--rendertiddler $:/core/save/all markdowndemo.html text/plain ^
	|| exit 1

rem classicparserdemo.html: wiki to demo classicparser plugin

node .\tiddlywiki.js ^
	.\editions\classicparserdemo ^
	--verbose ^
	--output %TW5_BUILD_OUTPUT% ^
	--rendertiddler $:/core/save/all classicparserdemo.html text/plain ^
	|| exit 1

rem highlightdemo.html: wiki to demo highlight plugin

node .\tiddlywiki.js ^
	.\editions\highlightdemo ^
	--verbose ^
	--output %TW5_BUILD_OUTPUT% ^
	--rendertiddler $:/core/save/all highlightdemo.html text/plain ^
	|| exit 1

rem Make the CNAME file that GitHub Pages requires

echo tiddlywiki.com > %TW5_BUILD_OUTPUT%\CNAME

rem Run the test edition to run the Node.js tests and to generate test.html for tests in the browser

.\bin\test.cmd
