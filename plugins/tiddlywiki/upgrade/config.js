/*\
title: $:/plugins/tiddlywiki/upgrade/config.js
type: application/javascript
module-type: startup

Startup module for configuring the upgrade plugin

\*/

"use strict";

// Export name and synchronous status
exports.name = "upgrade-config";
exports.before = ["startup"];
exports.synchronous = true;

exports.startup = function() {
	// See $tw.utils.decryptStoreAreaInteractive() in $:/core/modules/utils/crypto.js
	$tw.config.usePasswordVault = true;
	$tw.config.disableAutoSave = true;
};
