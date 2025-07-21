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

const TITLE_REQUIRE_RELOAD_DUE_TO_PLUGIN_CHANGE = "$:/status/RequireReloadDueToPluginChange";

const PREFIX_CONFIG_REGISTER_PLUGIN_TYPE = "$:/config/RegisterPluginType/";

exports.startup = function() {
	$tw.wiki.addTiddler({title: TITLE_REQUIRE_RELOAD_DUE_TO_PLUGIN_CHANGE,text: "no"});
	$tw.wiki.addEventListener("change",(changes) => {
		// Work out which of the changed tiddlers are plugins that we need to reregister
		const changesToProcess = [];
		let requireReloadDueToPluginChange = false;
		$tw.utils.each(Object.keys(changes),(title) => {
			const tiddler = $tw.wiki.getTiddler(title);
			const requiresReload = $tw.wiki.doesPluginRequireReload(title);
			if(requiresReload) {
				requireReloadDueToPluginChange = true;
			} else if(tiddler) {
				const pluginType = tiddler.fields["plugin-type"];
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
				const changedShadowTiddlers = {};
				// Collect the shadow tiddlers of any deleted plugins
				$tw.utils.each(changes.deletedPlugins,(pluginTitle) => {
					const pluginInfo = $tw.wiki.getPluginInfo(pluginTitle);
					if(pluginInfo) {
						$tw.utils.each(Object.keys(pluginInfo.tiddlers),(title) => {
							changedShadowTiddlers[title] = true;
						});
					}
				});
				// Collect the shadow tiddlers of any modified plugins
				$tw.utils.each(changes.modifiedPlugins,(pluginTitle) => {
					const pluginInfo = $tw.wiki.getPluginInfo(pluginTitle);
					if(pluginInfo && pluginInfo.tiddlers) {
						$tw.utils.each(Object.keys(pluginInfo.tiddlers),(title) => {
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
				$tw.utils.each(Object.keys(changedShadowTiddlers),(title) => {
					$tw.wiki.enqueueTiddlerEvent(title,changedShadowTiddlers[title],true);
				});
			}
		}
	});
};

