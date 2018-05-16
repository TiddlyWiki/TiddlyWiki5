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
		for (var i = 0; i < shortcutTiddlers.length; i++) {
			var title = shortcutTiddlers[i];
			var tiddlerFields = $tw.wiki.getTiddler(title).fields;
			shortcutKeysList[i] = tiddlerFields["key"] !== undefined ? tiddlerFields["key"] : undefined;
			shortcutActionList[i] = tiddlerFields["text"];
			shortcutParsedList[i] = $tw.keyboardManager.parseKeyDescriptors(shortcutKeysList[i]);
		}

		document.addEventListener("keydown",function(event) {
			var key, action;
			for (i = 0; i < shortcutTiddlers.length; i++) {
				if ($tw.keyboardManager.checkKeyDescriptors(event,shortcutParsedList[i])) {
					key = shortcutKeysList[i];
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
			var newList = [],
				hasChanged = null;
			$tw.utils.each($tw.wiki.filterTiddlers("[all[shadows+tiddlers]tag[$:/tags/KeyboardShortcut]!has[draft.of]]"),function(title) {
				newList.push(title);
				if($tw.utils.hop(changes,title)) {
					hasChanged = true;
				}
			});

			if(hasChanged) {
				shortcutTiddlers = newList;
				shortcutKeysList = [];
				shortcutActionList = [];
				shortcutParsedList = [];
				for (i = 0; i < shortcutTiddlers.length; i++) {
					var title = shortcutTiddlers[i];
					var tiddlerFields = $tw.wiki.getTiddler(title).fields;
					shortcutKeysList[i] = tiddlerFields["key"] !== undefined ? tiddlerFields["key"] : undefined;
					shortcutActionList[i] = tiddlerFields["text"];
					shortcutParsedList[i] = $tw.keyboardManager.parseKeyDescriptors(shortcutKeysList[i]);
				}
			}
		});
	}
};

})();
