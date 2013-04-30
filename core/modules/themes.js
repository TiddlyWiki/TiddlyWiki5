/*\
title: $:/core/modules/themes.js
type: application/javascript
module-type: global

Manages themes and styling.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var THEME_PLUGIN_TITLE = "$:/theme", // This tiddler contains the title of the current theme plugin
	DEFAULT_THEME_PLUGIN = "$:/themes/tiddlywiki/snowwhite";

function ThemeManager(wiki) {
	this.wiki = wiki;
	// There's no theme to start with
	this.currentThemeTitle = undefined;
	// Switch to the current theme
	this.switchTheme();
	// Listen for changes to the theme
	var self = this;
	this.wiki.addEventListener("change",function(changes) {
		if($tw.utils.hop(changes,THEME_PLUGIN_TITLE)) {
			self.switchTheme();
		}
	});
}

ThemeManager.prototype.switchTheme = function() {
	// Get the name of the current theme
	var themePluginTitle = this.wiki.getTiddlerText(THEME_PLUGIN_TITLE,DEFAULT_THEME_PLUGIN);
	// Get the theme plugin
	var themePluginTiddler = this.wiki.getTiddler(themePluginTitle);
	// Complain if we don't have a theme
	if(!themePluginTiddler || !themePluginTiddler.isPlugin()) {
		return $tw.utils.error("Cannot load theme " + themePluginTitle);
	}
	// Accumulate the titles of the plugins that we need to load
	var themePlugins = [],
		self = this,
		accumulatePlugin = function(title) {
			var tiddler = self.wiki.getTiddler(title);
			if(tiddler && tiddler.isPlugin() && themePlugins.indexOf(title) === -1) {
				themePlugins.push(title);
				var pluginInfo = JSON.parse(self.wiki.getTiddlerText(title));
				$tw.utils.each(pluginInfo.dependents,function(title) {
					accumulatePlugin(title);
				});
			}
		};
	accumulatePlugin(themePluginTitle);
	// Unregister any existing theme tiddlers
	var unregisteredThemeTiddlers = $tw.wiki.unregisterPluginTiddlers("theme");
	// Accumulate the titles of shadow tiddlers that have changed as a result of this switch
	var changedTiddlers = {};
	$tw.utils.each(this.wiki.shadowTiddlers,function(shadowInfo,title) {
		if(unregisteredThemeTiddlers.indexOf(shadowInfo.source) !== -1) {
			changedTiddlers[title] = true; // isDeleted?
		}
	});
	// Register any new theme tiddlers
	var registeredThemeTiddlers = $tw.wiki.registerPluginTiddlers("theme",themePlugins);
	// Unpack the current theme tiddlers
	$tw.wiki.unpackPluginTiddlers();
	// Accumulate the affected shadow tiddlers
	$tw.utils.each(this.wiki.shadowTiddlers,function(shadowInfo,title) {
		if(registeredThemeTiddlers.indexOf(shadowInfo.source) !== -1) {
			changedTiddlers[title] = false; // isDeleted?
		}
	});
	// Issue change events for the modified tiddlers
	$tw.utils.each(changedTiddlers,function(status,title) {
		self.wiki.enqueueTiddlerEvent(title,status);
	});
};

exports.ThemeManager = ThemeManager;

})();
