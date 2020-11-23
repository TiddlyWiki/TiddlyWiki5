/*\
title: $:/core/modules/upgraders/plugins.js
type: application/javascript
module-type: upgrader

Upgrader module that checks that plugins are newer than any already installed version

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var UPGRADE_LIBRARY_TITLE = "$:/UpgradeLibrary";

var BLOCKED_PLUGINS = {
	"$:/themes/tiddlywiki/stickytitles": {
		versions: ["*"]
	},
	"$:/plugins/tiddlywiki/fullscreen": {
		versions: ["*"]
	}
};

exports.upgrade = function(wiki,titles,tiddlers) {
	var self = this,
		messages = {},
		upgradeLibrary,
		getLibraryTiddler = function(title) {
			if(!upgradeLibrary) {
				upgradeLibrary = wiki.getTiddlerData(UPGRADE_LIBRARY_TITLE,{});
				upgradeLibrary.tiddlers = upgradeLibrary.tiddlers || {};
			}
			return upgradeLibrary.tiddlers[title];
		};

	// Go through all the incoming tiddlers
	$tw.utils.each(titles,function(title) {
		var incomingTiddler = tiddlers[title];
		// Check if we're dealing with a plugin
		if(incomingTiddler && incomingTiddler["plugin-type"]) {
			// Check whether the plugin contains JS modules
			var requiresReload = wiki.doesPluginInfoRequireReload(JSON.parse(incomingTiddler.text)) ? (wiki.getTiddlerText("$:/language/ControlPanel/Plugins/PluginWillRequireReload") + " ") : "";
			messages[title] = requiresReload;
			if(incomingTiddler.version) {
				// Upgrade the incoming plugin if it is in the upgrade library
				var libraryTiddler = getLibraryTiddler(title);
				if(libraryTiddler && libraryTiddler["plugin-type"] && libraryTiddler.version) {
					tiddlers[title] = libraryTiddler;
					messages[title] = requiresReload + $tw.language.getString("Import/Upgrader/Plugins/Upgraded",{variables: {incoming: incomingTiddler.version, upgraded: libraryTiddler.version}});
					return;
				}
				// Suppress the incoming plugin if it is older than the currently installed one
				var existingTiddler = wiki.getTiddler(title);
				if(existingTiddler && existingTiddler.hasField("plugin-type") && existingTiddler.hasField("version")) {
					// Reject the incoming plugin by blanking all its fields
					if($tw.utils.checkVersions(existingTiddler.fields.version,incomingTiddler.version)) {
						tiddlers[title] = Object.create(null);
						messages[title] = $tw.language.getString("Import/Upgrader/Plugins/Suppressed/Version",{variables: {incoming: incomingTiddler.version, existing: existingTiddler.fields.version}});
						return;
					}
				}
			}
			// Check whether the plugin is on the blocked list
			var blockInfo = BLOCKED_PLUGINS[title];
			if(blockInfo) {
				if(blockInfo.versions.indexOf("*") !== -1 || (incomingTiddler.version && blockInfo.versions.indexOf(incomingTiddler.version) !== -1)) {
					tiddlers[title] = Object.create(null);
					messages[title] = $tw.language.getString("Import/Upgrader/Plugins/Suppressed/Incompatible");
					return;
				}
			}
		}
	});
	return messages;
};

})();
