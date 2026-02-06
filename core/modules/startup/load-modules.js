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

// Set to `true` to enable performance instrumentation
var PERFORMANCE_INSTRUMENTATION_CONFIG_TITLE = "$:/config/Performance/Instrumentation";

var widget = require("$:/core/modules/widgets/widget.js");

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
	// --------------------------
	// The rest of the startup process here is not strictly to do with loading modules, but are needed before other startup
	// modules are executed. It is easier to put them here than to introduce a new startup module
	// --------------------------
	// Create a root widget for attaching event handlers. By using it as the parentWidget for another widget tree, one can reuse the event handlers
	$tw.rootWidget = new widget.widget({
		type: "widget",
		children: []
	},{
		wiki: $tw.wiki,
		document: $tw.browser ? document : $tw.fakeDocument
	});
	// Set up the performance framework
	$tw.perf = new $tw.Performance($tw.wiki.getTiddlerText(PERFORMANCE_INSTRUMENTATION_CONFIG_TITLE,"no") === "yes");
	// Kick off the filter tracker
	$tw.filterTracker = new $tw.FilterTracker($tw.wiki);
	$tw.wiki.addEventListener("change",function(changes) {
		$tw.filterTracker.handleChangeEvent(changes);
	});
	// Kick off the background action dispatcher
	$tw.backgroundActionDispatcher = new $tw.BackgroundActionDispatcher($tw.filterTracker,$tw.wiki);
	if($tw.node) {
		$tw.Commander.initCommands();
	}
};
