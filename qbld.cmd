@echo off

rem Abbreviated version of bld.sh for quicker builds

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

rem The tw5.com wiki
rem  index.html: the main file, including content

node .\tiddlywiki.js ^
	.\editions\tw5.com ^
	--verbose ^
	--rendertiddler $:/core/save/all %TW5_BUILD_OUTPUT%\index.html text/plain ^
	--savetiddler $:/favicon.ico %TW5_BUILD_OUTPUT%\favicon.ico ^
	|| exit 1
