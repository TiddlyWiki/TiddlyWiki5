/*\
title: $:/plugins/tiddlywiki/filesystem/filesystemwatchers/chokidar.js
type: application/javascript
module-type: filesystemwatcher

The default dynamic store watcher provider, implemented with chokidar.

\*/

"use strict";

exports.name = "chokidar";

exports.create = function(options) {
	var chokidar = require("chokidar"),
		watcher = chokidar.watch(options.directory,{
			ignoreInitial: true,
			persistent: true,
			depth: options.searchSubdirectories ? undefined : 0,
			followSymlinks: options.followSymlinks,
			awaitWriteFinish: {stabilityThreshold: 100,pollInterval: 50},
			ignored: options.isIgnored
		});
	watcher.on("add",function(filepath) {
		options.onEvent(filepath,"change");
	});
	watcher.on("change",function(filepath) {
		options.onEvent(filepath,"change");
	});
	watcher.on("unlink",function(filepath) {
		options.onEvent(filepath,"unlink");
	});
	watcher.on("error",options.onError);
	return watcher;
};
