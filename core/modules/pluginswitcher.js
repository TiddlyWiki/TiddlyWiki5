/*\
title: $:/core/modules/pluginswitcher.js
type: application/javascript
module-type: global

Manages switching plugins for themes and languages.

\*/

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
	const self = this;
	this.wiki.addEventListener("change",(changes) => {
		if($tw.utils.hop(changes,self.controllerTitle)) {
			self.switchPlugins();
		}
	});
}

PluginSwitcher.prototype.switchPlugins = function() {
	// Get the name of the current theme
	let selectedPluginTitle = this.wiki.getTiddlerText(this.controllerTitle);
	// If it doesn't exist, then fallback to one of the default themes
	let index = 0;
	while(!this.wiki.getTiddler(selectedPluginTitle) && index < this.defaultPlugins.length) {
		selectedPluginTitle = this.defaultPlugins[index++];
	}
	// Accumulate the titles of the plugins that we need to load
	const plugins = [];
	const self = this;
	const accumulatePlugin = function(title) {
		const tiddler = self.wiki.getTiddler(title);
		if(tiddler && tiddler.isPlugin() && !plugins.includes(title)) {
			plugins.push(title);
			const pluginInfo = $tw.utils.parseJSONSafe(self.wiki.getTiddlerText(title));
			const dependents = $tw.utils.parseStringArray(tiddler.fields.dependents || "");
			$tw.utils.each(dependents,(title) => {
				accumulatePlugin(title);
			});
		}
	};
	accumulatePlugin(selectedPluginTitle);
	// Read the plugin info for the incoming plugins
	const changes = $tw.wiki.readPluginInfo(plugins);
	// Unregister any existing theme tiddlers
	const unregisteredTiddlers = $tw.wiki.unregisterPluginTiddlers(this.pluginType);
	// Register any new theme tiddlers
	const registeredTiddlers = $tw.wiki.registerPluginTiddlers(this.pluginType,plugins);
	// Unpack the current theme tiddlers
	$tw.wiki.unpackPluginTiddlers();
	// Call the switch handler
	if(this.onSwitch) {
		this.onSwitch(plugins);
	}
};

exports.PluginSwitcher = PluginSwitcher;
