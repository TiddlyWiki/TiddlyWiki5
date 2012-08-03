/*\
title: $:/core/modules/recipe.js
type: application/javascript
module-type: tiddlerdeserializer

Module to deserialize tiddlers from an old school TiddlyWiki recipe file.

The idea is to process the recipe file recursively, loading tiddlers into the main store using synchronous file operations. The tiddlers have their titles prefixed with the associated marker in curly brackets ("{shadow}", "{tiddler}" etc).

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports["application/x-tiddlywiki-recipe"] = function(text,fields) {
	var self = this,
		path = require("path"),
		fs = require("fs"),
		tiddlers = [],
		parseRecipe = function(text) {
			var recipe = [];
			text.toString().split(/\r?\n/mg).forEach(function(line) {
				var p = line.indexOf(":");
				if(p !== -1) {
					recipe.push({
						name: line.substr(0,p).trim(),
						value: line.substr(p+1).trim()
					});
				}
			});
			return recipe;
		},
		loadTiddlersFromFile = function(sourcePath,prefix) {
			var ext = path.extname(sourcePath),
				extensionInfo = $tw.config.fileExtensionInfo[ext],
				typeInfo = extensionInfo ? $tw.config.contentTypeInfo[extensionInfo.type] : null,
				data = fs.readFileSync(sourcePath).toString(typeInfo ? typeInfo.encoding : "utf8"),
				fields = {title: sourcePath},
				tids = self.deserializeTiddlers(ext,data,fields),
				metafile = sourcePath + ".meta";
			if(ext !== ".json" && tids.length === 1 && fs.existsSync(metafile)) {
				var metadata = fs.readFileSync(metafile).toString("utf8");
				if(metadata) {
					tids = [$tw.utils.parseFields(metadata,tids[0])];
				}
			}
			tids.forEach(function(tid) {
				tid.title = prefix + tid.title;
			});
			tiddlers.push.apply(tiddlers,tids);
		},
		processRecipe = function(sourcePath,text) {
			var recipe = parseRecipe(text);
			for(var t=0; t<recipe.length; t++) {
				if(recipe[t].name === "recipe") {
					var recipeFile = path.resolve(path.dirname(sourcePath),recipe[t].value);
					processRecipe(recipeFile,fs.readFileSync(recipeFile));
				} else {
					var tiddlerFile = path.resolve(path.dirname(sourcePath),recipe[t].value);
					loadTiddlersFromFile(tiddlerFile,"{" + recipe[t].name + "}");
				}
			}
		},
		sourcePath = fields.title; // Bit of a hack to take advantage of the default title being the path to the tiddler file
	processRecipe(sourcePath,text);
	return tiddlers;
};

})();
