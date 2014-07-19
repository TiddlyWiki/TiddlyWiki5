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

var DONT_IMPORT_LIST = ["$:/StoryList","$:/HistoryList"];

exports.upgrade = function(wiki,titles,tiddlers) {
	var self = this,
		messages = {};
	// Check for tiddlers on our list
	$tw.utils.each(titles,function(title) {
		if(DONT_IMPORT_LIST.indexOf(title) !== -1) {
			tiddlers[title] = Object.create(null);
			messages[title] = $tw.language.getString("Import/Upgrader/System/Suppressed");
		}
	});
	return messages;
};

})();
