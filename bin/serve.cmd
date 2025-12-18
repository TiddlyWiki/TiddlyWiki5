:: This script allows you to serve different TiddlyWiki editions. 
::
:: It respects a TW_SERVE_EDITION_PATH environment variable.
:: If this variable is set it will be used. A command line parameter will overwrite it.
::
:: Ensure your server tiddlywiki.info configuration contains
:: these plugins, otherwise saving is not possible:
::   - "tiddlywiki/tiddlyweb"
::   - "tiddlywiki/filesystem"

@echo off
echo.

:: Help Wanted!! 
:: If you know how to improve -help and -version handling let us know

if "%1" == "--help" call :help
if "%1" == "-h" call :help

if "%1" == "--version" call :version
if "%1" == "-v" call :version

if "%1" == "help" (
	call :help
) else (
	call :main %1 %2 %3 %4 %5
)
exit 0

:version
echo TiddlyWiki serve.cmd script version 0.0.2"
echo.
exit 0
goto:eof

:help
echo Serve TiddlyWiki over HTTP
echo.
echo Optional parameters
echo  - %%1 .. edition directory	.. full or relative path to edition directory
echo  - %%2 .. username 		.. for signing edits - can be empty like this: '""'
echo  - %%3 .. password 		.. can be empty like this: '""'
echo  - %%4 .. IP address or HOST 	.. defaults to localhost
echo  - %%5 .. PORT			.. defaults to 8080
echo.
echo Example 1 .\serve .\editions\tw5.com-server username
echo Example 2 .\serve .\editions\tw5.com-server '""' '""' localhost 9090 
echo .. Example 2 defines: empty username, empty password
echo.
echo Help information
echo  -v, --version		.. shows the script version
echo  -h, --help, help	.. shows this help information
echo.

exit 0
goto:eof

:main
if [%1] NEQ [] (
	:: if there is a editions parameter .. use it.
	set TW_SERVE_EDITION_PATH=%1
) else (
	if [%TW_SERVE_EDITION_PATH%] == [] (
		echo Please provide an edition path as your first parameter or
		echo define a valid TW_SERVE_EDITION_PATH environment variable.
		echo.
		echo Using default edition path 'editions\tw5.com-server' because no environment variable is set
		echo.
		set TW_SERVE_EDITION_PATH= editions\tw5.com-server
	)
)

:: The editions path must exist!
if not exist %TW_SERVE_EDITION_PATH%\nul (
	echo The Path: "%TW_SERVE_EDITION_PATH%" does not exist
	exit 1
)

if [%5] == [] (
	echo Using default port 8080
	set PORT=8080
) else (
	echo Using port %5
	set PORT=%5
)

echo Using edition: %TW_SERVE_EDITION_PATH%
echo.

node .\tiddlywiki.js ^
	%TW_SERVE_EDITION_PATH% ^
	--verbose ^
	--server %PORT% $:/core/save/all text/plain text/html %2 %3 %4^
	|| exit 1
goto:eof
