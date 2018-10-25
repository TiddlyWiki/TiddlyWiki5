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
		// Keydown Listener for shortcuts
		$tw.utils.addEventListeners(document,[
			{name: "keydown",handlerObject: $tw.keyboardManager,handlerMethod: "handleKeydownEvent"}
		]);
	}
};

})();
