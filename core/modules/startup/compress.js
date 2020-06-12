/*\
title: $:/core/modules/startup/compress.js
type: application/javascript
module-type: startup

Compression handling

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "compress";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

exports.startup = function() {
	// Ensure that $:/isCompressed is maintained properly
	$tw.wiki.addEventListener("change",function(changes) {
		if ($tw.utils.hop(changes,"$:/isCompressed")) {
			$tw.compress.updateCompressStateTiddler()
		}
	});
};

})();
