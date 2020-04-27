/*\
title: $:/core/modules/startup/favicon.js
type: application/javascript
module-type: startup

Favicon handling

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "favicon";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;
		
// Favicon tiddler
var FAVICON_TITLE = "$:/favicon.ico";

exports.startup = function() {
	// Set up the favicon
	setFavicon();
	// Reset the favicon when the tiddler changes
	$tw.wiki.addEventListener("change",function(changes) {
		if($tw.utils.hop(changes,FAVICON_TITLE)) {
			setFavicon();
		}
	});
};

function setFavicon() {
	var tiddler = $tw.wiki.getTiddler(FAVICON_TITLE);
	if(tiddler) {
		var faviconLink = document.getElementById("faviconLink");
		if(tiddler.fields._canonical_uri) {
			faviconLink.setAttribute("href",tiddler.fields._canonical_uri);
		} else {
			faviconLink.setAttribute("href","data:" + tiddler.fields.type + ";base64," + tiddler.fields.text);			
		}
	}
}

})();
