/*\
title: $:/core/modules/startup/plugins.js
type: application/javascript
module-type: startup

Startup logic concerned with managing plugins

\*/

"use strict";

// Export name and synchronous status
exports.name = "plugins";
exports.after = ["load-modules"];
exports.before = ["startup"];
exports.synchronous = true;

exports.startup = function() {
	$tw.utils.installPluginChangeHandler($tw.wiki);
};

