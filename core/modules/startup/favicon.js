/*\
title: $:/core/modules/startup/favicon.js
type: application/javascript
module-type: startup

Favicon handling

\*/

"use strict";

// Export name and synchronous status
exports.name = "favicon";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

// Favicon tiddler
var FAVICON_TITLE = "$:/favicon.ico";

exports.startup = function() {
	var setFavicon = function() {
		var tiddler = $tw.wiki.getTiddler(FAVICON_TITLE);
		if(tiddler) {
			var faviconLink = document.getElementById("faviconLink"),
				dataURI = $tw.utils.makeDataUri(tiddler.fields.text,tiddler.fields.type,tiddler.fields._canonical_uri);
			faviconLink.setAttribute("href",dataURI);
			$tw.faviconPublisher.send({verb: "FAVICON",body: dataURI});
		}
	}
	$tw.faviconPublisher = new $tw.utils.BrowserMessagingPublisher({type: "FAVICON", onsubscribe: setFavicon});
	// Set up the favicon
	setFavicon();
	// Reset the favicon when the tiddler changes
	$tw.wiki.addEventListener("change",function(changes) {
		if($tw.utils.hop(changes,FAVICON_TITLE)) {
			setFavicon();
		}
	});
};
