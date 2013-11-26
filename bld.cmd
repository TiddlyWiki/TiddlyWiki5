@echo off

rem build TiddlyWiki5 for five.tiddlywiki.com

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

rem Create the `static` directory if necessary

setlocal enableextensions
mkdir %TW5_BUILD_OUTPUT%\static
setlocal disableextensions

rem Delete any existing content

del /q /s %TW5_BUILD_OUTPUT%\static

rem First,
rem  readme.md: the readme file for GitHub
rem  index.html: the main file, including content
rem  static.html: the static version of the default tiddlers

node .\tiddlywiki.js ^
	.\editions\tw5.com ^
	--verbose ^
	--rendertiddler ReadMe .\readme.md text/html ^
	--rendertiddler ContributingTemplate .\contributing.md text/html ^
	--rendertiddler $:/core/save/all %TW5_BUILD_OUTPUT%\index.html text/plain ^
	--rendertiddler $:/editions/tw5.com/save-empty %TW5_BUILD_OUTPUT%\empty2.html text/plain ^
	--rendertiddler $:/core/templates/static.template.html %TW5_BUILD_OUTPUT%\static.html text/plain ^
	--rendertiddler $:/core/templates/static.template.css %TW5_BUILD_OUTPUT%\static\static.css text/plain ^
	--rendertiddlers [!is[system]] $:/core/templates/static.tiddler.html %TW5_BUILD_OUTPUT%\static text/plain ^
	|| exit 1

rem Second, encrypted.html: a version of the main file encrypted with the password "password"

node .\tiddlywiki.js ^
	.\editions\tw5.com ^
	--verbose ^
	--password password ^
	--rendertiddler $:/core/save/all %TW5_BUILD_OUTPUT%\encrypted.html text/plain ^
	|| exit 1

rem Third, empty.html: empty wiki for reuse

node .\tiddlywiki.js ^
	.\editions\empty ^
	--verbose ^
	--rendertiddler $:/core/save/all %TW5_BUILD_OUTPUT%\empty.html text/plain ^
	|| exit 1

rem Fourth, tahoelafs.html: empty wiki with plugin for Tahoe-LAFS

node .\tiddlywiki.js ^
	.\editions\tahoelafs ^
	--verbose ^
	--rendertiddler $:/core/save/all %TW5_BUILD_OUTPUT%\tahoelafs.html text/plain ^
	|| exit 1

rem Fifth, d3demo.html: wiki to demo d3 plugin

node .\tiddlywiki.js ^
	.\editions\d3demo ^
	--verbose ^
	--rendertiddler $:/core/save/all %TW5_BUILD_OUTPUT%\d3demo.html text/plain ^
	|| exit 1

rem Sixth, codemirrordemo.html: wiki to demo codemirror plugin

node .\tiddlywiki.js ^
	.\editions\codemirrordemo ^
	--verbose ^
	--rendertiddler $:/core/save/all %TW5_BUILD_OUTPUT%\codemirrordemo.html text/plain ^
	|| exit 1

rem Seventh, codemirrordemo.html: wiki to demo codemirror plugin

node .\tiddlywiki.js ^
	.\editions\markdowndemo ^
	--verbose ^
	--rendertiddler $:/core/save/all %TW5_BUILD_OUTPUT%\markdowndemo.html text/plain ^
	|| exit 1


rem Make the CNAME file that GitHub Pages requires

echo five.tiddlywiki.com > %TW5_BUILD_OUTPUT%\CNAME

rem Eighth, run the test edition to run the Node.js tests and to generate test.html for tests in the browser

.\test.cmd
