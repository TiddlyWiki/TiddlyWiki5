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

function debounce(callback) {
	var timeout = null;
	return function() {
		clearTimeout(timeout);
		timeout = setTimeout(callback,$tw.syncer.throttleInterval);
	};
}

function setupEvents(host) {
	var events = new EventSource(host + "events/plugins/tiddlywiki/tiddlyweb");
	var debouncedSync = debounce($tw.syncer.syncFromServer.bind($tw.syncer));
	events.addEventListener("change",debouncedSync);
	events.onerror = function() {
		events.close();
		setTimeout(function() {
			setupEvents(host);
		},$tw.syncer.errorRetryInterval);
	};
}
})();
