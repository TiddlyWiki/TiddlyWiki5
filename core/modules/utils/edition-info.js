/*\
title: $:/core/modules/utils/edition-info.js
type: application/javascript
module-type: utils-node

Information about the available editions

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var fs = require("fs"),
	path = require("path");

var editionInfo;

exports.getEditionInfo = function() {
	if(!editionInfo) {
		// Enumerate the edition paths
		var editionPaths = $tw.getLibraryItemSearchPaths($tw.config.editionsPath,$tw.config.editionsEnvVar);
		editionInfo = {};
		for(var editionIndex=0; editionIndex<editionPaths.length; editionIndex++) {
			var editionPath = editionPaths[editionIndex];
			// Enumerate the folders
			var entries = fs.readdirSync(editionPath);
			for(var entryIndex=0; entryIndex<entries.length; entryIndex++) {
				var entry = entries[entryIndex];
				// Check if directories have a valid tiddlywiki.info
				if(!editionInfo[entry] && $tw.utils.isDirectory(path.resolve(editionPath,entry))) {
					var info = $tw.utils.parseJSONSafe(fs.readFileSync(path.resolve(editionPath,entry,"tiddlywiki.info"),"utf8"),null);
					if(info) {
						editionInfo[entry] = info;
					}
				}
			}
		}
	}
	return editionInfo;
};

})();
