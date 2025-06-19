/*\
title: $:/core/modules/startup/load-modules.js
type: application/javascript
module-type: startup

Load core modules

\*/

"use strict";

// Export name and synchronous status
exports.name = "load-modules";
exports.synchronous = true;

exports.startup = function() {
	// Load modules
	$tw.modules.applyMethods("utils",$tw.utils);
	if($tw.node) {
		$tw.modules.applyMethods("utils-node",$tw.utils);
	}
	if($tw.browser) {
		$tw.modules.applyMethods("utils-browser",$tw.utils);
	}
	$tw.modules.applyMethods("global",$tw);
	$tw.modules.applyMethods("config",$tw.config);
	$tw.Tiddler.fieldModules = $tw.modules.getModulesByTypeAsHashmap("tiddlerfield");
	$tw.modules.applyMethods("tiddlermethod",$tw.Tiddler.prototype);
	$tw.modules.applyMethods("wikimethod",$tw.Wiki.prototype);
	$tw.wiki.addIndexersToWiki();
	$tw.modules.applyMethods("tiddlerdeserializer",$tw.Wiki.tiddlerDeserializerModules);
	$tw.macros = $tw.modules.getModulesByTypeAsHashmap("macro");
	$tw.wiki.initParsers();
	$tw.Commander.initCommands();
};
