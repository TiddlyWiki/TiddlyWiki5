/*\
title: $:/core/modules/upgraders/plugins.js
type: application/javascript
module-type: upgrader

Upgrader module that checks that plugins are newer than any already installed version

\*/

"use strict";

const UPGRADE_LIBRARY_TITLE = "$:/UpgradeLibrary";

const BLOCKED_PLUGINS = {
	"$:/themes/tiddlywiki/stickytitles": {
		versions: ["*"]
	},
	"$:/plugins/tiddlywiki/fullscreen": {
		versions: ["*"]
	}
};

exports.upgrade = function(wiki,titles,tiddlers) {
	const self = this;
	const messages = {};
	let upgradeLibrary;
	const getLibraryTiddler = function(title) {
		if(!upgradeLibrary) {
			upgradeLibrary = wiki.getTiddlerData(UPGRADE_LIBRARY_TITLE,{});
			upgradeLibrary.tiddlers = upgradeLibrary.tiddlers || {};
		}
		return upgradeLibrary.tiddlers[title];
	};

	// Go through all the incoming tiddlers
	$tw.utils.each(titles,(title) => {
		const incomingTiddler = tiddlers[title];
		// Check if we're dealing with a plugin
		if(incomingTiddler && incomingTiddler["plugin-type"]) {
			// Check whether the plugin contains JS modules
			const requiresReload = wiki.doesPluginInfoRequireReload($tw.utils.parseJSONSafe(incomingTiddler.text)) ? (`${wiki.getTiddlerText("$:/language/ControlPanel/Plugins/PluginWillRequireReload")} `) : "";
			messages[title] = requiresReload;
			if(incomingTiddler.version) {
				// Upgrade the incoming plugin if it is in the upgrade library
				const libraryTiddler = getLibraryTiddler(title);
				if(libraryTiddler && libraryTiddler["plugin-type"] && libraryTiddler.version) {
					tiddlers[title] = libraryTiddler;
					messages[title] = requiresReload + $tw.language.getString("Import/Upgrader/Plugins/Upgraded",{variables: {incoming: incomingTiddler.version,upgraded: libraryTiddler.version}});
					return;
				}
				// Suppress the incoming plugin if it is older than the currently installed one
				const existingTiddler = wiki.getTiddler(title);
				if(existingTiddler && existingTiddler.hasField("plugin-type") && existingTiddler.hasField("version")) {
					// Reject the incoming plugin by blanking all its fields
					if($tw.utils.checkVersions(existingTiddler.fields.version,incomingTiddler.version)) {
						tiddlers[title] = Object.create(null);
						messages[title] = $tw.language.getString("Import/Upgrader/Plugins/Suppressed/Version",{variables: {incoming: incomingTiddler.version,existing: existingTiddler.fields.version}});
						return;
					}
				}
			}
			// Check whether the plugin is on the blocked list
			const blockInfo = BLOCKED_PLUGINS[title];
			if(blockInfo) {
				if(blockInfo.versions.includes("*") || (incomingTiddler.version && blockInfo.versions.includes(incomingTiddler.version))) {
					tiddlers[title] = Object.create(null);
					messages[title] = $tw.language.getString("Import/Upgrader/Plugins/Suppressed/Incompatible");
					return;
				}
			}
		}
	});
	return messages;
};
