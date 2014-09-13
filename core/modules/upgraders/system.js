/*\
title: $:/core/modules/upgraders/system.js
type: application/javascript
module-type: upgrader

Upgrader module that suppresses certain system tiddlers that shouldn't be imported

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var DONT_IMPORT_LIST = ["$:/StoryList","$:/HistoryList"],
	DONT_IMPORT_PREFIX_LIST = ["$:/temp/","$:/state/"];

exports.upgrade = function(wiki,titles,tiddlers) {
	var self = this,
		messages = {};
	// Check for tiddlers on our list
	$tw.utils.each(titles,function(title) {
		if(DONT_IMPORT_LIST.indexOf(title) !== -1) {
			tiddlers[title] = Object.create(null);
			messages[title] = $tw.language.getString("Import/Upgrader/System/Suppressed");
		} else {
			for(var t=0; t<DONT_IMPORT_PREFIX_LIST.length; t++) {
				var prefix = DONT_IMPORT_PREFIX_LIST[t];
				if(title.substr(0,prefix.length) === prefix) {
					tiddlers[title] = Object.create(null);
					messages[title] = $tw.language.getString("Import/Upgrader/State/Suppressed");
				}
			}
		}
	});
	return messages;
};

})();
