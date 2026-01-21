/*\
title: $:/boot/boot.node.js
type: application/javascript

This file contains node-specific code, such as plugin loading.
It does not get included with javascript sent to browsers or packed into files.

WARNING: The exact layout and design of this file is still in flux and subject to change. Avoid creating plugins that utilize it.

\*/

var	path = require("path"),
	fs = require("fs");

exports.findPluginInPaths = function(name,paths) {
	var pathIndex = 0;
	do {
		var pluginPath = path.resolve(paths[pathIndex],"./" + name);
		try {
			// It is faster to try and fail to stat the dir
			// than to make an extra synchronous "fs" call just
			// to see if it exists. So try/catch.
			if(fs.statSync(pluginPath).isDirectory()) {
				return pluginPath;
			}
		} catch(e) {
			e; // Failed. Probably didn't exist. Move on.
		}
	} while(++pathIndex < paths.length);
	return null;
};

// We put the NPM method afterward, so it gets loaded second.
// We search paths first.
if(process.env.npm_lifecycle_event) {
	// It appears we're running as an npm script.
	// We'll add to exports a method which will search
	// in possible npm locations.
	exports.findPluginInNPM = function(name) {
		return getNpmMap()[name];
	};
}

var npmMap;

/*
Returns an object mapping plugin names to absolute filepaths.
*/
function getNpmMap() {
	if(!npmMap) {
		npmMap = Object.create(null);
		var cwd = process.cwd();
		var searchPaths = require("module")._nodeModulePaths(cwd);
		// We go in reverse order, so that higher priority npm paths will
		// override lower priority ones as we go.
		for(var i = searchPaths.length-1; i >= 0; i--) {
			var modulesDir = searchPaths[i];
			try {
				var files = fs.readdirSync(modulesDir);
				for(var j = 0; j < files.length; j++) {
					var pkgJsonPath = path.resolve(modulesDir, files[j], "package.json");
					try {
						var pkg = JSON.parse(fs.readFileSync(pkgJsonPath,"utf8"));
						if(pkg.tiddlywiki) {
							for(var pluginName in pkg.tiddlywiki) {
								npmMap[pluginName] = path.resolve(modulesDir, files[j], pkg.tiddlywiki[pluginName]);
							}
						}
					} catch(e) {
						e; // File likely didn't exist. Move on.
					}
				}
			} catch(e) {
				e; // Modules directory likely didn't exist. Also move on.
			}
		}
	}
	return npmMap;
}
