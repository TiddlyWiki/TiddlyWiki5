/*\
title: $:/core/modules/startup/plugins.js
type: application/javascript
module-type: startup

Startup logic concerned with managing plugins

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "plugins";
exports.after = ["load-modules"];
exports.synchronous = true;

// Stat
var REQUIRE_RELOAD_DUE_TO_PLUGIN_CHANGE = "$:/status/RequireReloadDueToPluginChange";

exports.startup = function() {
	$tw.wiki.addTiddler({title: REQUIRE_RELOAD_DUE_TO_PLUGIN_CHANGE,text: "no"});
	$tw.wiki.addEventListener("change",function(changes) {
		var changesToProcess = [],
			requireReloadDueToPluginChange = false;
		$tw.utils.each(Object.keys(changes),function(title) {
			var tiddler = $tw.wiki.getTiddler(title),
				containsModules = $tw.wiki.doesPluginContainModules(title);
			if(containsModules) {
				requireReloadDueToPluginChange = true;
			} else if(tiddler && tiddler.fields["plugin-type"] === "import") {
				// Ignore import tiddlers
			} else {
				// Otherwise process it
				changesToProcess.push(title);
			}
		});
		if(requireReloadDueToPluginChange) {
			$tw.wiki.addTiddler({title: REQUIRE_RELOAD_DUE_TO_PLUGIN_CHANGE,text: "yes"});
		}
		// Read or delete the plugin info of the changed tiddlers
		var changes = $tw.wiki.readPluginInfo(changesToProcess);
		if(changes.modifiedPlugins.length > 0 || changes.deletedPlugins.length > 0) {
			// (Re-)register any modified plugins
			$tw.wiki.registerPluginTiddlers(null,changes.modifiedPlugins);
			// Unregister any deleted plugins
			$tw.wiki.unregisterPluginTiddlers(null,changes.deletedPlugins);
			// Unpack the shadow tiddlers
			$tw.wiki.unpackPluginTiddlers();
		}
	});
};

})();
