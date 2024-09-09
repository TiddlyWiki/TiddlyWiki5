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
exports.before = ["startup"];
exports.synchronous = true;

var TITLE_REQUIRE_RELOAD_DUE_TO_PLUGIN_CHANGE = "$:/status/RequireReloadDueToPluginChange";

var PREFIX_CONFIG_REGISTER_PLUGIN_TYPE = "$:/config/RegisterPluginType/";

exports.startup = function() {
	$tw.wiki.addTiddler({title: TITLE_REQUIRE_RELOAD_DUE_TO_PLUGIN_CHANGE,text: "no"});
	$tw.wiki.addEventListener("change",function(changes) {
		// Work out which of the changed tiddlers are plugins that we need to reregister
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
		// Issue warning if any of the tiddlers require a reload
		if(requireReloadDueToPluginChange) {
			$tw.wiki.addTiddler({title: TITLE_REQUIRE_RELOAD_DUE_TO_PLUGIN_CHANGE,text: "yes"});
		}
		// Read or delete the plugin info of the changed tiddlers
		if(changesToProcess.length > 0) {
			var changes = $tw.wiki.readPluginInfo(changesToProcess);
			if(changes.modifiedPlugins.length > 0 || changes.deletedPlugins.length > 0) {
				var changedShadowTiddlers = {};
				// Collect the shadow tiddlers of any deleted plugins
				$tw.utils.each(changes.deletedPlugins,function(pluginTitle) {
					var pluginInfo = $tw.wiki.getPluginInfo(pluginTitle);
					if(pluginInfo) {
						$tw.utils.each(Object.keys(pluginInfo.tiddlers),function(title) {
							changedShadowTiddlers[title] = true;
						});
					}
				});
				// Collect the shadow tiddlers of any modified plugins
				$tw.utils.each(changes.modifiedPlugins,function(pluginTitle) {
					var pluginInfo = $tw.wiki.getPluginInfo(pluginTitle);
					if(pluginInfo && pluginInfo.tiddlers) {
						$tw.utils.each(Object.keys(pluginInfo.tiddlers),function(title) {
							changedShadowTiddlers[title] = false;
						});
					}
				});
				// (Re-)register any modified plugins
				$tw.wiki.registerPluginTiddlers(null,changes.modifiedPlugins);
				// Unregister any deleted plugins
				$tw.wiki.unregisterPluginTiddlers(null,changes.deletedPlugins);
				// Unpack the shadow tiddlers
				$tw.wiki.unpackPluginTiddlers();
				// Queue change events for the changed shadow tiddlers
				$tw.utils.each(Object.keys(changedShadowTiddlers),function(title) {
					$tw.wiki.enqueueTiddlerEvent(title,changedShadowTiddlers[title]);
				});
			}
		}
	});
};

})();
