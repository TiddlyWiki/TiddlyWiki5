/*\
title: $:/core/modules/macros/displayshortcuts.js
type: application/javascript
module-type: macro

Macro to display a list of keyboard shortcuts in human readable form. Notably, it resolves named shortcuts like `((bold))` to the underlying keystrokes.

\*/

"use strict";

/*
Information about this macro
*/

exports.name = "displayshortcuts";

exports.params = [
	{name: "shortcuts"},
	{name: "prefix"},
	{name: "separator"},
	{name: "suffix"}
];

/*
Run the macro
*/
exports.run = function(shortcuts,prefix,separator,suffix) {
	var shortcutArray = $tw.keyboardManager.getPrintableShortcuts($tw.keyboardManager.parseKeyDescriptors(shortcuts,{
		wiki: this.wiki
	}));
	if(shortcutArray.length > 0) {
		shortcutArray.sort(function(a,b) {
		    return a.toLowerCase().localeCompare(b.toLowerCase());
		})
		return prefix + shortcutArray.join(separator) + suffix;
	} else {
		return "";
	}
};
