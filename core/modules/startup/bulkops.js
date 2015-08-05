/*\
title: $:/core/modules/startup/bulkops.js
type: application/javascript
module-type: startup

Support for bulk tiddler operations

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "bulkops";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

exports.startup = function() {
	$tw.rootWidget.addEventListener("tm-rename-tiddler",function(event) {
		var paramObject = event.paramObject || {};
		$tw.wiki.renameTiddler(paramObject.from,paramObject.to);
	});
};

})();
