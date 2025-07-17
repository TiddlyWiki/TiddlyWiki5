/*\
title: $:/core/modules/upgraders/system.js
type: application/javascript
module-type: upgrader

Upgrader module that suppresses certain system tiddlers that shouldn't be imported

\*/

"use strict";

const DONT_IMPORT_LIST = new Set(["$:/Import","$:/build"]);
const UNSELECT_PREFIX_LIST = ["$:/temp/","$:/state/","$:/StoryList","$:/HistoryList"];
const WARN_IMPORT_PREFIX_LIST = ["$:/core/modules/"];

exports.upgrade = function(wiki,titles,tiddlers) {
	const self = this;
	const messages = {};
	let showAlert = false;
	// Check for tiddlers on our list
	$tw.utils.each(titles,(title) => {
		if(DONT_IMPORT_LIST.has(title)) {
			tiddlers[title] = Object.create(null);
			messages[title] = $tw.language.getString("Import/Upgrader/System/Suppressed");
		} else {
			for(var t = 0;t < UNSELECT_PREFIX_LIST.length;t++) {
				var prefix = UNSELECT_PREFIX_LIST[t];
				if(title.substr(0,prefix.length) === prefix) {
					messages[title] = $tw.language.getString("Import/Upgrader/Tiddler/Unselected");
				}
			}
			for(var t = 0;t < WARN_IMPORT_PREFIX_LIST.length;t++) {
				var prefix = WARN_IMPORT_PREFIX_LIST[t];
				if(title.substr(0,prefix.length) === prefix && wiki.isShadowTiddler(title)) {
					showAlert = true;
					messages[title] = $tw.language.getString("Import/Upgrader/System/Warning");
				}
			}
		}
	});
	if(showAlert) {
		const logger = new $tw.utils.Logger("import");
		logger.alert($tw.language.getString("Import/Upgrader/System/Alert"));
	}
	return messages;
};
