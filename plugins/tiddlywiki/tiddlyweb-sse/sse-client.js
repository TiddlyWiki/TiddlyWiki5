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
    $tw.hooks.addHook("th-syncadaptor-status-response",function(args) {
        var err = args[0],
            isLoggedIn = args[1],
            username = args[2],
            isReadOnly = args[3],
            isAnonymous = args[4],
            isPollingDisabled = args[5];
        if(err || $tw.syncer.syncadaptor.name !== "tiddlyweb") { return; }
        // Get the mount point in case a path prefix is used
        var host = $tw.syncer.syncadaptor.getHost();
        // Make sure it ends with a slash (it usually does)
        if(host[host.length - 1] !== "/") { host += "/"; }
        // Setup the event listener
        setupSSE(host);
    });
}

function debounce(callback) {
    var timeout = null;
    return function() {
        clearTimeout(timeout);
        timeout = setTimeout(callback,$tw.syncer.throttleInterval);
    };
}

var source = null;

function setupSSE(host,refresh) {
    if(window.EventSource) {
        if(source && source.readyState !== source.CLOSED) { source.close(); }

        source = new EventSource(host + "events/plugins/tiddlywiki/tiddlyweb-sse/wiki-change",{ withCredentials: true });

        var debouncedSync = debounce($tw.syncer.syncFromServer.bind($tw.syncer));
        source.addEventListener("change",debouncedSync);
        source.onerror = function() {
            // return if we're reconnecting because that's handled automatically
            if(source.readyState === source.CONNECTING) { return; }
            // wait for the errorRetryInterval
            setTimeout(function() {
                //call this function to set everything up again
                setupSSE(host,true);
            },$tw.syncer.errorRetryInterval);
        };
        source.onopen = function() {
            // only run this on first open, not on auto reconnect
            source.onopen = function() { };
            // once we've properly opened, disable polling
            $tw.syncer.wiki.addTiddler({ title: $tw.syncer.titleSyncDisablePolling,text: "yes" });
            //sync from server manually here to make sure we stay up to date
            if(refresh) { $tw.syncer.syncFromServer(); }
        }
    }
}

})();