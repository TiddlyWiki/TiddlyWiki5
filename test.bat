mkdir tmp\newcooked

node tiddlywiki.js --recipe test\tiddlywiki.2.6.5\source\tiddlywiki.com\index.html.recipe --savewiki tmp\newcooked

windiff tmp\newcooked\index.html test\tiddlywiki.2.6.5\target\index.2.6.5.html

node tiddlywiki.js --wikitest test\wikitests\

rem jshint *.js
rem jshint js
rem jshint tiddlywiki5\boot\*.js
