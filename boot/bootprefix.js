/*\
title: $:/boot/bootprefix.js
type: application/javascript

This file sets up the globals that need to be available when JavaScript modules are executed in the browser. The overall sequence is:

# BootPrefix.js
# <module definitions>
# Boot.js

See Boot.js for further details of the boot process.

\*/

var _bootprefix = (function($tw) {

"use strict";

$tw = $tw || {browser: typeof(window) !== "undefined" ? {} : null};

/*
Information about each module is kept in an object with these members:
	moduleType: type of module
	definition: object, function or string defining the module; see below
	exports: exports of the module, filled in after execution

The `definition` can be of several types:

* An object can be used to directly specify the exports of the module
* A function with the arguments `module,require,exports` that returns `exports`
* A string function body with the same arguments

Each moduleInfo object is stored in two hashmaps: $tw.modules.titles and $tw.modules.types. The first is indexed by title and the second is indexed by type and then title
*/
$tw.modules = {
	titles: {}, // hashmap by module name of moduleInfo
	types: {} // hashmap by module type and then name of moduleInfo
};

/*
Define a JavaScript tiddler module for later execution
	moduleName: name of module being defined
	moduleType: type of module
	definition: module definition; see discussion above
*/
$tw.modules.define = function(moduleName,moduleType,definition) {
	// Create the moduleInfo
	var moduleInfo = {
		moduleType: moduleType,
		definition: definition,
		exports: undefined
	};
	// If the definition is already an object we can use it as the exports
	if(typeof moduleInfo.definition === "object") {
		moduleInfo.exports = definition;
	}
	// Store the module in the titles hashmap
	if(Object.prototype.hasOwnProperty.call($tw.modules.titles,moduleName)) {
		console.log("Warning: Redefined module - " + moduleName);
	}
	$tw.modules.titles[moduleName] = moduleInfo;
	// Store the module in the types hashmap
	if(!Object.prototype.hasOwnProperty.call($tw.modules.types,moduleType)) {
		$tw.modules.types[moduleType] = {};
	}
	if(Object.prototype.hasOwnProperty.call($tw.modules.types[moduleType],moduleName)) {
		console.log("Warning: Redefined module - " + moduleName);
	}
	$tw.modules.types[moduleType][moduleName] = moduleInfo;
};

/*
External JavaScript can populate this array before calling boot.js in order to preload tiddlers
*/
$tw.preloadTiddlers = $tw.preloadTiddlers || [];

/*
Convenience function for pushing a tiddler onto the preloading array
*/
$tw.preloadTiddler = function(fields) {
	$tw.preloadTiddlers.push(fields);
};

return $tw

});

if(typeof(exports) === "undefined") {
	// Set up $tw global for the browser
	window.$tw = _bootprefix();
} else {
	// Export functionality as a module
	exports.bootprefix = _bootprefix;
}



