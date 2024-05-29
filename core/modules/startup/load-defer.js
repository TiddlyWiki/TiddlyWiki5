/*\
title: $:/core/modules/startup/load-defer.js
type: application/javascript
module-type: startup

Register tiddlerloader plugins and load deferred tiddlers.
\*/
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "load-defer";
exports.platforms = ["node"];
exports.after = ["plugins"];
exports.synchronous = true;

var parsers = {};

$tw.deserializerParsers = parsers;

exports.startup = function(callback) {
	var path = require("path");
	// First, exec all tiddlerloaders
	$tw.modules.forEachModuleOfType("tiddlerLoader",function(title,module) {
		for(var f in module) {
			if($tw.utils.hop(module,f)) {
				parsers[f] = module[f]; // Store the parser class
			}
		}
	});

	var specs = $tw.deferredDirSpecs;
	$tw.utils.each(specs, function(spec){

		var fpath = spec.filepath;
		var tiddlers = $tw.loadTiddlersFromSpecification(fpath, undefined, {loadDeferred: true})
		$tw.utils.each(tiddlers,function(tiddlerFile) {
			$tw.utils.each(tiddlerFile.tiddlers,function(tiddler) {
				var relativePath = path.relative($tw.boot.wikiTiddlersPath,tiddlerFile.filepath);
				// Keep track of our file tiddlers, so add them to boot.files
				$tw.boot.files[tiddler.title] = {
					filepath: tiddlerFile.filepath,
					type: tiddlerFile.type,
					hasMetaFile: tiddlerFile.hasMetaFile,
					isEditableFile: tiddlerFile.isEditableFile || tiddlerFile.filepath.indexOf($tw.boot.wikiTiddlersPath) !== 0,
					originalpath: relativePath
				};
			});
			$tw.wiki.addTiddlers(tiddlerFile.tiddlers);
		});
	});
};
