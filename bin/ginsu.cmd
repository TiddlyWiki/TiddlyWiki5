@echo off

rem Split the tiddlers out of a TiddlyWiki file

node .\tiddlywiki.js ^
	.\editions\empty ^
	--verbose ^
	--load %1 ^
	--output tmp ^
	--rendertiddlers [!is[system]] $:/core/templates/tid-tiddler ginsu text/plain .tid ^
	--rendertiddler $:/core/templates/split-recipe ginsu\split.recipe text/plain ^
	|| exit 1
