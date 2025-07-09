/*\
title: $:/core/modules/utils/edition-info.js
type: application/javascript
module-type: utils-node

Information about the available editions

\*/

"use strict";

const fs = require("fs");
const path = require("path");

let editionInfo;

exports.getEditionInfo = function() {
	if(!editionInfo) {
		// Enumerate the edition paths
		const editionPaths = $tw.getLibraryItemSearchPaths($tw.config.editionsPath,$tw.config.editionsEnvVar);
		editionInfo = {};
		for(let editionIndex = 0;editionIndex < editionPaths.length;editionIndex++) {
			const editionPath = editionPaths[editionIndex];
			// Enumerate the folders
			const entries = fs.readdirSync(editionPath);
			for(let entryIndex = 0;entryIndex < entries.length;entryIndex++) {
				const entry = entries[entryIndex];
				// Check if directories have a valid tiddlywiki.info
				// Check if the entry is a hidden directory
				if((entry.charAt(0) !== ".") && !editionInfo[entry] && $tw.utils.isDirectory(path.resolve(editionPath,entry))) {
					const file = path.resolve(editionPath,entry,"tiddlywiki.info");
					if(fs.existsSync(file)) {
						const info = $tw.utils.parseJSONSafe(fs.readFileSync(file,"utf8"),null);
						if(info) {
							editionInfo[entry] = info;
						}
					}
				}
			}
		}
	}
	return editionInfo;
};
