/*\
title: $:/core/modules/startup/load-modules.js
type: application/javascript
module-type: startup

Load core modules

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "load-modules";
exports.synchronous = true;

// Set to `true` to enable performance instrumentation
var PERFORMANCE_INSTRUMENTATION_CONFIG_TITLE = "$:/config/Performance/Instrumentation";

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
	// --------------------------
	// The rest of the startup process here is not strictly to do with loading modules, but are needed before other startup
	// modules are executed. It is easier to put them here than to introduce a new startup module
	// --------------------------
	// Set up the performance framework
	$tw.perf = new $tw.Performance($tw.wiki.getTiddlerText(PERFORMANCE_INSTRUMENTATION_CONFIG_TITLE,"no") === "yes");
	// Kick off the filter tracker
	$tw.filterTracker = new $tw.FilterTracker($tw.wiki);
};

})();
