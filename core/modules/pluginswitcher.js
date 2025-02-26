/*\
title: $:/core/modules/pluginswitcher.js
type: application/javascript
module-type: global

Manages switching plugins for themes and languages.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
options:
wiki: wiki store to be used
pluginType: type of plugin to be switched
controllerTitle: title of tiddler used to control switching of this resource
defaultPlugins: array of default plugins to be used if nominated plugin isn't found
onSwitch: callback when plugin is switched (single parameter is array of plugin titles)
*/
function PluginSwitcher(options) {
	this.wiki = options.wiki;
	this.pluginType = options.pluginType;
	this.controllerTitle = options.controllerTitle;
	this.defaultPlugins = options.defaultPlugins || [];
	this.onSwitch = options.onSwitch;
	// Switch to the current plugin
	this.switchPlugins();
	// Listen for changes to the selected plugin
	var self = this;
	this.wiki.addEventListener("change",function(changes) {
		if($tw.utils.hop(changes,self.controllerTitle)) {
			self.switchPlugins();
		}
	});
}

PluginSwitcher.prototype.switchPlugins = function() {
	var self = this;
	// Get the name of the current theme
	var selectedPluginTitle = this.wiki.getTiddlerText(this.controllerTitle);
	// If it doesn't exist, then fallback to one of the default themes
	var index = 0;
	while(!this.wiki.getTiddler(selectedPluginTitle) && index < this.defaultPlugins.length) {
		selectedPluginTitle = this.defaultPlugins[index++];
	}
	// Accumulate the titles of the plugins that we need to load
	var plugins = [],
		self = this,
		accumulatePlugin = function(title) {
			var tiddler = self.wiki.getTiddler(title);
			if(tiddler && tiddler.isPlugin() && plugins.indexOf(title) === -1) {
				plugins.push(title);
				var dependents = $tw.utils.parseStringArray(tiddler.fields.dependents || "");
				$tw.utils.each(dependents,function(title) {
					accumulatePlugin(title);
				});
			}
		};
	accumulatePlugin(selectedPluginTitle);
	// Read the plugin info for the incoming plugins
	var changedPluginInfo = this.wiki.readPluginInfo(plugins);
	// Collect the shadow tiddlers of any deleted plugins
	var changedShadowTiddlers = {};
	$tw.utils.each(changedPluginInfo.deletedPlugins,function(pluginTitle) {
		var contents = changedPluginInfo.deletedPluginContents[pluginTitle];
		if(contents && contents.tiddlers) {
			$tw.utils.each(Object.keys(contents.tiddlers),function(title) {
				changedShadowTiddlers[title] = true;
			});
		}
	});
	// Collect the shadow tiddlers of any modified plugins
	$tw.utils.each(changedPluginInfo.modifiedPlugins,function(pluginTitle) {
		var pluginInfo = self.wiki.getPluginInfo(pluginTitle);
		if(pluginInfo && pluginInfo.tiddlers) {
			$tw.utils.each(Object.keys(pluginInfo.tiddlers),function(title) {
				changedShadowTiddlers[title] = false;
			});
		}
	});
	// Unregister any existing theme/language tiddlers
	var unregisteredTiddlers = this.wiki.unregisterPluginTiddlers(this.pluginType);
	// Register any new theme/language tiddlers
	var registeredTiddlers = this.wiki.registerPluginTiddlers(this.pluginType,plugins);
	// Unpack the current theme/language tiddlers
	this.wiki.unpackPluginTiddlers(this.doDebug);
	// Queue change events for the changed shadow tiddlers
	$tw.utils.each(changedShadowTiddlers,function(status,title) {
		self.wiki.enqueueTiddlerEvent(title,changedShadowTiddlers[title], true);
	});
	// Call the switch handler
	if(this.onSwitch) {
		this.onSwitch(plugins);
	}
};

exports.PluginSwitcher = PluginSwitcher;

})();
