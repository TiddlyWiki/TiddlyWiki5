/*\
title: $:/core/modules/utils/dom/keyboard.js
type: application/javascript
module-type: utils

Keyboard utilities; now deprecated. Instead, use $tw.keyboardManager

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

["parseKeyDescriptor","checkKeyDescriptor"].forEach(function(method) {
	exports[method] = function() {
		if($tw.keyboardManager) {
			return $tw.keyboardManager[method].apply($tw.keyboardManager,Array.prototype.slice.call(arguments,0));
		} else {
			return null
		}
	};
});

})();
