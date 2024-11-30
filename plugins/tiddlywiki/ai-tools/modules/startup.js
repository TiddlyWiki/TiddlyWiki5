/*\
title: $:/plugins/tiddlywiki/ai-tools/modules/startup.js
type: application/javascript
module-type: startup

Setup the root widget event handlers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "ai-tools";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

// Install the root widget event handlers
exports.startup = function() {
	var ConversationsArchiveImporter = require("$:/plugins/tiddlywiki/ai-tools/modules/conversations-archive-importer.js").ConversationsArchiveImporter;
	$tw.conversationsArchiveImporter = new ConversationsArchiveImporter();
	$tw.rootWidget.addEventListener("tm-import-conversations",function(event) {
		$tw.conversationsArchiveImporter.import(event.widget,event.param);
	});
};

})();
