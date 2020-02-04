/*\
title: $:/plugins/tiddlywiki/share/rawmarkup.js
type: application/javascript
module-type: library

Read tiddlers from the browser location hash

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Get the hash
var rawHash = document.location.hash.substring(1);
if(rawHash.charAt(0) === "#") {
	var hash = decodeURIComponent(rawHash.substring(1));
	// Try to parse the hash as JSON
	var tiddlers;
	try {
		tiddlers= JSON.parse(hash);
	} catch(ex) {
	}
	if(tiddlers) {
		// Need to initialise these because we run before bootprefix.js and boot.js
		window.$tw = window.$tw || {};
		$tw.boot = $tw.boot || {};
		$tw.preloadTiddlers = $tw.preloadTiddlers || [];
		// Load our tiddlers
		$tw.preloadTiddlers = $tw.preloadTiddlers.concat(tiddlers);
	}
}

})();
