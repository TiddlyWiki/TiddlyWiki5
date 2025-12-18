/*\
title: $:/plugins/tiddlywiki/aws/init.js
type: application/javascript
module-type: startup

AWS initialisation

\*/

"use strict";

// Export name and synchronous status
exports.name = "aws-init";
exports.before = ["startup"];
exports.synchronous = true;

exports.startup = function() {
	var logger = new $tw.utils.Logger("aws");
		if($tw.node) {
		try {
			require("aws-sdk");
		} catch(e) {
			logger.alert("The plugin 'tiddlywiki/aws' requires the aws-sdk to be installed. Run 'npm install aws-sdk' in the root of the TiddlyWiki repository");
		}
	}
	if(!$tw.modules.titles["$:/plugins/tiddlywiki/async/async.js"]) {
		logger.alert("The plugin 'tiddlywiki/aws' requires the 'tiddlywiki/async' plugin to be installed");
	}
	if(!$tw.modules.titles["$:/plugins/tiddlywiki/jszip/jszip.js"]) {
		logger.alert("The plugin 'tiddlywiki/aws' requires the 'tiddlywiki/jszip' plugin to be installed");
	}
};
