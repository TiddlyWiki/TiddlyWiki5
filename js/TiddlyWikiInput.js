/*
Functions concerned with parsing TiddlyWiki files
*/

var tiddlerInput = require("./TiddlerInput.js"),
	utils = require("./Utils.js");

var tiddlyWikiInput = exports;

/*
Parses the text of a TiddlyWiki HTML file, and returns the tiddlers as an array of hashmaps of raw fields.

*/
tiddlyWikiInput.parseTiddlyWiki = function(tiddlywikidoc) {
	var results = [];
	var storeAreaPos = locateStoreArea(tiddlywikidoc);
	if(storeAreaPos) {
		var endOfDivRegExp = /(<\/div>\s*)/gi;
		var startPos = storeAreaPos[0];
		endOfDivRegExp.lastIndex = startPos;
		var match = endOfDivRegExp.exec(tiddlywikidoc);
		while(match && startPos < storeAreaPos[1]) {
			var endPos = endOfDivRegExp.lastIndex;
			var fields = tiddlerInput.parseTiddlerDiv(tiddlywikidoc.substring(startPos,endPos));
			results.push(fields);
			startPos = endPos;
			match = endOfDivRegExp.exec(tiddlywikidoc);
		}
	}
	return results;
}

function locateStoreArea(tiddlywikidoc)
{
	var startSaveArea = '<div id="' + 'storeArea">';
	var startSaveAreaRegExp = /<div id=["']?storeArea['"]?>/gi;
	var endSaveArea = '</d' + 'iv>';
	var endSaveAreaCaps = '</D' + 'IV>';
	var posOpeningDiv = tiddlywikidoc.search(startSaveAreaRegExp);
	var limitClosingDiv = tiddlywikidoc.indexOf("<"+"!--POST-STOREAREA--"+">");
	if(limitClosingDiv == -1) {
		limitClosingDiv = tiddlywikidoc.indexOf("<"+"!--POST-BODY-START--"+">");
	}
	var start = limitClosingDiv == -1 ? tiddlywikidoc.length : limitClosingDiv;
	var posClosingDiv = tiddlywikidoc.lastIndexOf(endSaveArea,start);
	if(posClosingDiv == -1) {
		posClosingDiv = tiddlywikidoc.lastIndexOf(endSaveAreaCaps,start);
	}
	return (posOpeningDiv != -1 && posClosingDiv != -1) ? [posOpeningDiv + startSaveArea.length,posClosingDiv] : null;
}
