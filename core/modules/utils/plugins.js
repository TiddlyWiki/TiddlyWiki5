/*\
title: $:/core/modules/utils/plugins.js
type: application/javascript
module-type: utils

Plugin utilities

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var TITLE_REQUIRE_RELOAD_DUE_TO_PLUGIN_CHANGE = "$:/status/RequireReloadDueToPluginChange";

var PREFIX_CONFIG_REGISTER_PLUGIN_TYPE = "$:/config/RegisterPluginType/";

exports.installPluginChangeHandler = function(wiki) {
	wiki.addTiddler({title: TITLE_REQUIRE_RELOAD_DUE_TO_PLUGIN_CHANGE,text: "no"});
	wiki.addEventListener("change",function(changes) {
		// Work out which of the changed tiddlers are plugins that we need to (re)register
		var changesToProcess = [];
		$tw.utils.each(Object.keys(changes),function(title) {
			var tiddler = wiki.getTiddler(title);
			if(tiddler) {
				// It is a plugin that has been added or modified and is of a type that we need to register
				if(tiddler.isPlugin() && wiki.getTiddlerText(PREFIX_CONFIG_REGISTER_PLUGIN_TYPE + (tiddler.fields["plugin-type"] || ""),"no") === "yes") {
					changesToProcess.push(title);
				}
			} else {
				if(wiki.isSubPlugin(title)) {
					// It is a sub-plugin
					changesToProcess.push(title);
				} else {
					// It is a plugin that has been deleted
					var pluginInfo = wiki.getPluginInfo(title)
					if(pluginInfo) {
						changesToProcess.push(title);
					}
				}
			}
		});
		if(changesToProcess.length > 0) {
			// Read the plugin info of the changed tiddlers
			var changedPluginInfo = wiki.readPluginInfo(changesToProcess);
			if(changedPluginInfo.modifiedPlugins.length > 0 || changedPluginInfo.deletedPlugins.length > 0) {
				var changedShadowTiddlers = {},
					requireReloadDueToPluginChange = false;
				// Collect the shadow tiddlers of any deleted plugins
				$tw.utils.each(changedPluginInfo.deletedPlugins,function(pluginTitle) {
					var contents = changedPluginInfo.deletedPluginContents[pluginTitle];
					if(contents && contents.tiddlers) {
						$tw.utils.each(Object.keys(contents.tiddlers),function(title) {
							changedShadowTiddlers[title] = true;
							if(contents.tiddlers[title].type === "application/javascript") {
								requireReloadDueToPluginChange = true;
							}
						});
					}
				});
				// Collect the shadow tiddlers of any modified plugins
				$tw.utils.each(changedPluginInfo.modifiedPlugins,function(pluginTitle) {
					var pluginInfo = wiki.getPluginInfo(pluginTitle);
					if(pluginInfo && pluginInfo.tiddlers) {
						$tw.utils.each(Object.keys(pluginInfo.tiddlers),function(title) {
							changedShadowTiddlers[title] = false;
							if(pluginInfo.tiddlers[title].type === "application/javascript") {
								requireReloadDueToPluginChange = true;
							}
						});
					}
				});
				// (Re-)register any modified plugins
				wiki.registerPluginTiddlers(null,changedPluginInfo.modifiedPlugins);
				// Unregister any deleted plugins
				wiki.unregisterPluginTiddlers(null,changedPluginInfo.deletedPlugins);
				// Unpack the shadow tiddlers
				wiki.unpackPluginTiddlers();
				// Queue change events for the changed shadow tiddlers
				$tw.utils.each(changedShadowTiddlers,function(status,title) {
					wiki.enqueueTiddlerEvent(title,changedShadowTiddlers[title], true);
				});
				// Issue warning if any of the tiddlers require a reload
				if(requireReloadDueToPluginChange) {
					wiki.addTiddler({title: TITLE_REQUIRE_RELOAD_DUE_TO_PLUGIN_CHANGE,text: "yes"});
				}
			}
		}
	});
};



})();
