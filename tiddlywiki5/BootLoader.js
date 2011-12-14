(function() {
	
/*jslint node: true */
"use strict";

/*
Given the absolute path of a srcModule, and a relative reference to a dstModule, return the fully resolved module name
*/
function resolveModuleName(srcModule,dstModule) {
	var src = srcModule.split("/"),
		dst = dstModule.split("/"),
		c;
	// If the destination starts with / or ./ then it's a reference to an ordinary module
	if(dstModule.substr(0,1) === "/" || dstModule.substr(0,2) === "./" ) {
		// Remove the filename part of the src path
		src.splice(src.length-1,1);
		// Process the destination path bit by bit
		while(dst.length > 0) {
			c = dst.shift();
			switch(c) {
				case ".": // Ignore dots
					break;
				case "..": // Slice off the last src directory for a double dot
					src.splice(src.length-1,1);
					break;
				default: // Copy everything else across
					src.push(c);
					break;
			}
		}
		return src.join("/");
	} else {
		// If there was no / or ./ then it's a built in module and the name doesn't need resolving
		return dstModule;		
	}
}

/*
Execute the module named 'modName'. The name can optionally be relative to the module named 'modRoot'
*/
function executeModule(modName,modRoot) {
	var name = modRoot ? resolveModuleName(modRoot,modName) : modName,
		require = function(modRequire) {
			return executeModule(modRequire,name);
		},
		exports = {},
		module = modules[name];
	if(!module) {
		throw new Error("Cannot find module named '" + modName + "' required by module '" + modRoot + "'");
	}
	if(module.exports) {
		return module.exports;
	} else {
		module.module(require,exports);
		module.exports = exports;
		return exports;
	}
}

$(function() {
	// Execute the main module
	executeModule("js/Main.js");
})

})();