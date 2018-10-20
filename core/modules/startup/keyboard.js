/*\
title: $:/plugins/BurningTreeC/KeeBoord/modules/startup/keyboard.js
type: application/javascript
module-type: startup

Keyboard shortcut handling

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "global-shortcuts";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

exports.startup = function() {
	if($tw.browser) {
		var man = $tw.keyboardManager;
		// Get existing shortcut-tiddlers
		man.shortcutTiddlers = man.getShortcutTiddlerList(),
		man.shortcutKeysList = [], // Stores the shortcut-key descriptors
		man.shortcutActionList = [], // Stores the corresponding action strings
		man.shortcutParsedList = []; // Stores the parsed key descriptors

		// Cache shortcuts and corresponding actions at startup
		man.updateShortcutLists(man.shortcutTiddlers);

		// Keydown Listener for shortcuts
		document.addEventListener("keydown",function(event) {
			man.handleKeydownEvent(event);
		},false);

		// New listeners for new windows
		$tw.hooks.addHook("th-opening-window",function(srcDocument) {
			srcDocument.addEventListener("keydown",function(event) {
				man.handleKeydownEvent(event);
			},false);
			// Add click listener to be able to cancel popups
			srcDocument.addEventListener("click", function(event) {
				var numPopups = $tw.popup.popups.length;
				if(numPopups !== 0) {
					for(var i=0; i < numPopups; i++) {
						$tw.popup.handleEvent(event);
					}
				}
			});
		});

		// Detect changed shortcuts
		$tw.wiki.addEventListener("change",function(changes) {
			man.handleShortcutChanges(changes);
		});
	}
};

})();
