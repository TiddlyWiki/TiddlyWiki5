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

var TITLE_REQUIRE_RELOAD_DUE_TO_PLUGIN_CHANGE = "$:/status/RequireReloadDueToPluginChange";

var PREFIX_CONFIG_REGISTER_PLUGIN_TYPE = "$:/config/RegisterPluginType/";

exports.startup = function() {
	$tw.wiki.addTiddler({title: TITLE_REQUIRE_RELOAD_DUE_TO_PLUGIN_CHANGE,text: "no"});
	$tw.wiki.addEventListener("change",function(changes) {
		var changesToProcess = [],
			requireReloadDueToPluginChange = false;
		$tw.utils.each(Object.keys(changes),function(title) {
			var tiddler = $tw.wiki.getTiddler(title),
				requiresReload = $tw.wiki.doesPluginRequireReload(title);
			if(requiresReload) {
				requireReloadDueToPluginChange = true;
			} else if(tiddler) {
				var pluginType = tiddler.fields["plugin-type"];
				if($tw.wiki.getTiddlerText(PREFIX_CONFIG_REGISTER_PLUGIN_TYPE + (tiddler.fields["plugin-type"] || ""),"no") === "yes") {
					changesToProcess.push(title);
				}
			}
		});
		if(requireReloadDueToPluginChange) {
			$tw.wiki.addTiddler({title: TITLE_REQUIRE_RELOAD_DUE_TO_PLUGIN_CHANGE,text: "yes"});
		}
		// Read or delete the plugin info of the changed tiddlers
		if(changesToProcess.length > 0) {
			var changes = $tw.wiki.readPluginInfo(changesToProcess);
			if(changes.modifiedPlugins.length > 0 || changes.deletedPlugins.length > 0) {
				// (Re-)register any modified plugins
				$tw.wiki.registerPluginTiddlers(null,changes.modifiedPlugins);
				// Unregister any deleted plugins
				$tw.wiki.unregisterPluginTiddlers(null,changes.deletedPlugins);
				// Unpack the shadow tiddlers
				$tw.wiki.unpackPluginTiddlers();
			}
		}
	});
};

})();
