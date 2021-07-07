/*\
title: $:/plugins/tiddlywiki/tiddlyweb-sse/sse-client.js
type: application/javascript
module-type: startup

Miscellaneous startup logic for both the client and server.

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "hook-tiddlyweb-sse";
exports.after = ["startup"];
exports.platforms = ["browser"];
exports.synchronous = true;
exports.startup = function() {
	var source = null;
	$tw.hooks.addHook("th-syncer-status-response",function(syncer,success) {
		// technically any syncer instance can be used, but we only use the global one for this
		if(!success || syncer.syncadaptor.name !== "tiddlyweb" || $tw.syncer !== syncer) { return; }
		// check if we have a previous one and close it if we do
		if(source && source.readyState !== source.CLOSED) { source.close(); }
		// Get the mount point in case a path prefix is used
		var host = syncer.syncadaptor.getHost();
		// Make sure it ends with a slash (it usually does)
		if(host[host.length - 1] !== "/") { host += "/"; }
		var endpoint = host + "events/plugins/tiddlywiki/tiddlyweb-sse/wiki-change";
		// Setup the event listener
		source = exports.setupSSE(endpoint,syncer);
	});
}

function debounce(interval,callback) {
	var timeout = null;
	return function() {
		clearTimeout(timeout);
		timeout = setTimeout(callback,interval);
	};
}

exports.setupSSE = function setupSSE(endpoint,syncer,refresh) {
	if(window.EventSource) {
		var source = new EventSource(endpoint,{ withCredentials: true });
		var debouncedSync = debounce(syncer.throttleInterval,syncer.syncFromServer.bind(syncer));
		source.addEventListener("change",debouncedSync);
		source.onerror = function() {
			// return if we're reconnecting because that's handled automatically
			if(source.readyState === source.CONNECTING) { return; }
			// wait for the errorRetryInterval
			setTimeout(function() {
				//call this function to set everything up again
				exports.setupSSE(endpoint,syncer,true);
			},syncer.errorRetryInterval);
		};
		source.onopen = function() {
			// only run this on first open, not on auto reconnect
			source.onopen = function() {};
			// once we've properly opened, disable polling
			syncer.wiki.addTiddler({ title: syncer.titleSyncDisablePolling,text: "yes" });
			//sync from server manually here to make sure we stay up to date
			if(refresh) { syncer.syncFromServer(); }
		}
		return source;
	} else {
		return null;
	}
}

})();