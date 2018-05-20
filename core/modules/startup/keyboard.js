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
exports.name = "global-keyboard";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

exports.startup = function() {
	if($tw.browser) {
		var shortcutTiddlers = $tw.wiki.filterTiddlers("[all[shadows+tiddlers]tag[$:/tags/KeyboardShortcut]!has[draft.of]]"),
			shortcutKeysList = [],
			shortcutActionList = [],
			shortcutParsedList = [];

		function updateShortcutLists(tiddlerList) {
			shortcutTiddlers = tiddlerList;
			for (var i=0; i < tiddlerList.length; i++) {
				var title = tiddlerList[i],
					tiddlerFields = $tw.wiki.getTiddler(title).fields;
				shortcutKeysList[i] = tiddlerFields["key"] !== undefined ? tiddlerFields["key"] : undefined;
				shortcutActionList[i] = tiddlerFields["text"];
				shortcutParsedList[i] = shortcutKeysList[i] !== undefined ? $tw.keyboardManager.parseKeyDescriptors(shortcutKeysList[i]) : undefined;
			}
		};

		updateShortcutLists(shortcutTiddlers);

		document.addEventListener("keydown",function(event) {
			var key, action;
			for (var i = 0; i < shortcutTiddlers.length; i++) {
				if (shortcutParsedList[i] !== undefined && $tw.keyboardManager.checkKeyDescriptors(event,shortcutParsedList[i])) {
					key = shortcutParsedList[i];
					action = shortcutActionList[i];
				}
			}
			if(key !== undefined) {
				$tw.rootWidget.invokeActionString(action,$tw.rootWidget);
				return true;
			}
			return false;
		},false);

		$tw.wiki.addEventListener("change",function(changes) {
			var newList = $tw.wiki.filterTiddlers("[all[shadows+tiddlers]tag[$:/tags/KeyboardShortcut]!has[draft.of]]");
			var hasChanged = false;
			
			function changedTiddlers(tiddlerList) {
				for (var i = 0; i < tiddlerList.length; i++) {
					if($tw.utils.hop(changes,tiddlerList[i])) {
						return true;
					}
				}
				return false;
			};

			hasChanged = changedTiddlers(shortcutTiddlers);

			if(!hasChanged) {
				hasChanged = changedTiddlers(newList);
			}
			if(!hasChanged) {
				var shortcutConfigTiddlers = $tw.wiki.filterTiddlers("[all[shadows+tiddlers]prefix[$:/config/shortcuts]!has[draft.of]]");
				hasChanged = changedTiddlers(shortcutConfigTiddlers);
			}
			if(hasChanged) {
				updateShortcutLists(newList);
			}
		});
	}
};

})();

