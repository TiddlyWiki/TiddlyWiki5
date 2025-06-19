/*\
title: $:/plugins/tiddlywiki/mobiledragdrop/startup.js
type: application/javascript
module-type: startup

Startup initialisation

\*/

"use strict";

// Export name and synchronous status
exports.name = "mobiledragdrop";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

exports.startup = function() {
	window.addEventListener("touchmove", function() {});
};
