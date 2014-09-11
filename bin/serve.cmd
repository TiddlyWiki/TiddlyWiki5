:: This file uses the default settings for Jeremy and 
:: provides some help and more parameters for the rest of us.

@echo off
echo.

if "%1" == "--help" (
	call :help
)

if "%1" == "help" (
	call :help
) else (
	echo %1 %2 %3 %4 %5
	call :main %1 %2 %3 %4 %5
)
exit 0

:help
echo Serve TiddlyWiki5 over HTTP
echo.
echo Optional parameters
echo  - %%1 .. editions directory .. full path or relative to current directory
echo  - %%2 .. username for signing edits - can be empty like this: '""'
echo  - %%3 .. password - can be empty like this: '""'
echo  - %%4 .. IP address or HOST name .. defaults to localhost
echo  - %%5 .. PORT .. defaults to 8080
echo.
echo Example 1 .\serve .\edition\tw5.com-server username
echo Example 2 .\serve .\edition\tw5.com-server '""' '""' localhost 9090 
echo .. Example 2 defines: empty username, empty password
echo.
goto:eof

:main
if [%1] NEQ [] (
	:: if there is a editions parameter .. use it.
	set TIDDLYWIKI_EDITION_PATH=%1
) else (
	if [%TIDDLYWIKI_EDITION_PATH%] == [] (
		echo Provide an edition path as your first parameter or
		echo Define a valid TIDDLYWIKI_EDITION_PATH environment variable.
		echo.
		echo No environment variable set, using the default settings!
		echo.
		set TIDDLYWIKI_EDITION_PATH= editions\tw5.com-server
	)
)

:: The editions path must exist!
if not exist %TIDDLYWIKI_EDITION_PATH%\nul (
	echo The Path: "%TIDDLYWIKI_EDITION_PATH%" doesn't exist. Create it!
	exit 1
)

if [%5] == [] (
	echo Using default port 8080
	set PORT=8080
) else (
	echo Using port %5
	set PORT=%5
)

echo Usging edition: %TIDDLYWIKI_EDITION_PATH% !!
echo.

node .\tiddlywiki.js ^
	%TIDDLYWIKI_EDITION_PATH% ^
	--verbose ^
	--server %PORT% $:/core/save/all text/plain text/html %2 %3 %4^
	|| exit 1
goto:eof

