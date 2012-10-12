/*\
title: $:/core/bootprefix.js
type: application/javascript

This file sets up the globals that need to be available when JavaScript modules are executed in the browser. The overall sequence is:

# BootPrefix.js
# <module definitions>
# Boot.js

See Boot.js for further details of the boot process.

*/

// Set up $tw global for the browser
if(window && !window.$tw) {
	window.$tw = {browser: {}};
}

$tw.modules = {titles: {}}; // hashmap by module name of {fn:, exports:, moduleType:}

/*
Define a JavaScript tiddler module for later execution
	moduleName: name of module being defined
	moduleType: type of module
	fn: function defining the module, called with the arguments (module,require,exports)
*/
$tw.modules.define = function(moduleName,moduleType,fn) {
	$tw.modules.titles[moduleName] = {
		moduleType: moduleType,
		fn: fn
	};
};

/*
Define a tiddler
*/
$tw.preloadTiddlers = $tw.preloadTiddlers || [];

$tw.preloadTiddler = function(fields) {
	$tw.preloadTiddlers.push(fields);
};

