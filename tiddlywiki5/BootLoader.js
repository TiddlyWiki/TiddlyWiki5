(function() {
	
/*jslint node: true */
"use strict";

/*
A hashmap containing hashmaps about each module:
	{
		module1: {
			text: "<text of module1>",
			executed: true
		},
		module2: {
			text: "<text of module2>"
		}
	}
*/
var modules = {};

/*
The built in modules
*/
var builtInModules = {
	util: {
		
	},
	path: {
		
	},
	fs: {
		
	},
	url: {
		
	},
	http: {
		
	},
	https: {
		
	}
};

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
		// If there was no / or ./ then it's a built in module
		return dstModule;		
	}
}

function executeModule(name) {
	var require = function(filepath) {
			return executeModule(resolveModuleName(name,filepath));
		},
		exports = {},
		module = modules[name];
	if(!module) {
		throw new Error("Cannot find module named '" + name + "'");
	}
	if(module.executed) {
		return module.exports;
	} else {
		// This way of executing modules isn't perfect. Everything that is in scope here is available to the
		// scripts, so this mechanism should only be used for trusted code
		var script = "(function (require,exports){" + modules[name].text + "})(require,exports);"
		eval(script);
		module.executed = true;
		module.exports = exports;
		return exports;
	}
}

function findModules(childNodes) {
	// Iterate using the DOM directly; jQuery methods seem to bypass comment nodes
	childNodes = childNodes || document.childNodes;
	for(var t=0; t<childNodes.length; t++) {
		var node = childNodes[t];
		if(node.nodeName.toLowerCase() === "script" && node.type === "application/x-js-module") {
			modules[node.title] = {text: node.textContent};
		} else if(childNodes[t].childNodes.length > 0) {
			findModules(childNodes[t].childNodes);
		}
	}
}

$(function() {
	// Start with the embedded JavaScript modules
	for(var t in builtInModules) {
		modules[t] = builtInModules;
	}
	// Add any modules packed into script tags in the page
	findModules();
	// Execute the main module
	executeModule("js/Main.js");
})

})();