/*\
title: $:/core/modules/startup/keyboard.js
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
		
		man.lookupNames = [];
		man.lookupNames.push("shortcuts");
		$tw.platform.isMac ? man.lookupNames.push("shortcuts-mac") : man.lookupNames.push("shortcuts-not-mac");
		$tw.platform.isWindows ? man.lookupNames.push("shortcuts-windows") : man.lookupNames.push("shortcuts-not-windows");
		$tw.platform.isLinux ? man.lookupNames.push("shortcuts-linux") : man.lookupNames.push("shortcuts-not-linux");

		// Cache shortcuts and corresponding actions at startup
		man.updateShortcutLists(man.shortcutTiddlers);

		// Keydown Listener for shortcuts
		$tw.utils.addEventListeners(document,[
			{name: "keydown",handlerObject: $tw.keyboardManager,handlerMethod: "handleKeydownEvent"}
		]);

		// Detect changed shortcuts
		$tw.wiki.addEventListener("change",function(changes) {
			man.handleShortcutChanges(changes);
		});
	}
};

})();
