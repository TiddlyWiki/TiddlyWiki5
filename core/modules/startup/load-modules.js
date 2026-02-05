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
	$tw.functions = Object.assign($tw.modules.getModulesByTypeAsHashmap("macro"), $tw.modules.getModulesByTypeAsHashmap("function"));
	// Hook $tw.macros to display a deprecation warning when called
	function macros_handler(target, prop) {
		console.warn("Warning: $tw.macros is deprecated, use $tw.functions instead.");
		return target[prop];
	}
	$tw.macros = new Proxy($tw.functions, {get: macros_handler});
	$tw.wiki.initParsers();
	if($tw.node) {
		$tw.Commander.initCommands();
	}
};
