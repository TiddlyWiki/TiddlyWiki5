/*\
title: $:/plugins/tiddlywiki/classictools/recipe.js
type: application/javascript
module-type: tiddlerdeserializer

Module to deserialize tiddlers from an old school TiddlyWiki recipe file.

The idea is to process the recipe file recursively, loading tiddlers into the main store using synchronous file operations. The tiddlers have their titles prefixed with the associated marker in curly brackets ("{shadow}", "{tiddler}" etc).

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports["text/vnd.tiddlywiki2-recipe"] = function(text,fields) {
	var self = this,
		path = require("path"),
		fs = require("fs"),
		tiddlers = [],
		parseRecipe = function(text) {
			var recipe = [];
			text.toString().split(/\r?\n/mg).forEach(function(line) {
				// Check if the line is a comment
				if(line.charAt(0) !== "#") {
					// Find the colon splitting the name from the value
					var p = line.indexOf(":");
					if(p !== -1) {
						recipe.push({
							name: line.substr(0,p).trim(),
							value: line.substr(p+1).trim()
						});
					}
				}
			});
			return recipe;
		},
		loadTiddlersFromFile = function(sourcePath,prefix) {
			var ext = path.extname(sourcePath),
				extensionInfo = $tw.utils.getFileExtensionInfo(ext),
				typeInfo = extensionInfo ? $tw.config.contentTypeInfo[extensionInfo.type] : null,
				data = fs.readFileSync(sourcePath,typeInfo ? typeInfo.encoding : "utf8"),
				fields = {title: sourcePath},
				tids = self.deserializeTiddlers(ext,data,fields),
				metafile = sourcePath + ".meta";
			if(ext !== ".json" && tids.length === 1 && fs.existsSync(metafile)) {
				var metadata = fs.readFileSync(metafile,"utf8");
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
					processRecipe(recipeFile,fs.readFileSync(recipeFile,"utf8"));
				} else {
					var tiddlerFile = path.resolve(path.dirname(sourcePath),recipe[t].value);
					loadTiddlersFromFile(tiddlerFile,"{" + recipe[t].name + "}");
				}
			}
		},
		sourcePath = fields.title; // Bit of a hack to take advantage of the default title being the path to the tiddler file
	processRecipe(sourcePath,text);
	// Add a $:/RecipeTiddlers tiddler with the titles of the loaded tiddlers in order
	var titles = [];
	$tw.utils.each(tiddlers,function(tiddler) {
		titles.push(tiddler.title);
	});
	tiddlers.push({
		title: "$:/RecipeTiddlers",
		list: $tw.utils.stringifyList(titles)
	});
	return tiddlers;
};

})();
