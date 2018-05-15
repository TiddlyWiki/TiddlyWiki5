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
		$tw.utils.each($tw.wiki.filterTiddlers("[all[shadows+tiddlers]tag[keyboardShortcut]!has[draft.of]]"),function(title) {
			var self = this;
			var key = $tw.wiki.getTiddlerText(title);
			var keyInfoArray = $tw.keyboardManager.parseKeyDescriptors(key);
			document.addEventListener("keydown",function(event) {
				if($tw.keyboardManager.checkKeyDescriptors(event,keyInfoArray)) {
						$tw.rootWidget.invokeActionString($tw.wiki.getTiddlerText(title + '/action'));
						event.preventDefault();
						event.stopPropagation();
						return true;
				}
				return false;
			},false);
		});
	}
};

})();
