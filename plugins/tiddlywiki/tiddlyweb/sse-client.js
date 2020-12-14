/*\
title: $:/plugins/tiddlywiki/tiddlyweb/sse-client.js
type: application/javascript
module-type: startup

GET /recipes/default/tiddlers/:title

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "/events/plugins/tiddlywiki/tiddlyweb";
exports.after = ["startup"];
exports.synchronous = true;
exports.platforms = ["browser"];
exports.startup = function() {
	// Make sure we're actually being used
	if($tw.syncadaptor.name !== "tiddlyweb") {
		return;
	}
	// Get the mount point in case a path prefix is used
	var host = $tw.syncadaptor.getHost();
	// Make sure it ends with a slash (it usually does)
	if(host[host.length - 1] !== "/") {
		host += "/";
	}
	// Setup the event listener
	setupEvents(host);
};

function setupEvents(host) {
	var events = new EventSource(host + "events/plugins/tiddlywiki/tiddlyweb");
	var timeout = null;
	events.addEventListener("change",function() {
		if(timeout) clearTimeout(timeout);
		timeout = setTimeout(function(){
			$tw.syncer.syncFromServer();
		},$tw.syncer.throttleInterval);
	});
	events.onerror = function() {
		events.close();
		setTimeout(function() {
			setupEvents(host);
		},$tw.syncer.errorRetryInterval);
	};
}
})();
