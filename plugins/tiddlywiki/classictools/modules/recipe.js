/*\
title: $:/plugins/tiddlywiki/classictools/recipe.js
type: application/javascript
module-type: tiddlerdeserializer

Module to deserialize tiddlers from an old school TiddlyWiki recipe file.

The idea is to process the recipe file recursively, loading tiddlers into the main store using synchronous file operations. The tiddlers have their titles prefixed with the associated marker in curly brackets ("{shadow}", "{tiddler}" etc).

\*/

"use strict";

exports["text/vnd.tiddlywiki2-recipe"] = function(text,fields) {
	const self = this;
	const path = require("path");
	const fs = require("fs");
	const tiddlers = [];
	const parseRecipe = function(text) {
		const recipe = [];
		text.toString().split(/\r?\n/mg).forEach((line) => {
			// Check if the line is a comment
			if(line.charAt(0) !== "#") {
				// Find the colon splitting the name from the value
				const p = line.indexOf(":");
				if(p !== -1) {
					recipe.push({
						name: line.substr(0,p).trim(),
						value: line.substr(p + 1).trim()
					});
				}
			}
		});
		return recipe;
	};
	const loadTiddlersFromFile = function(sourcePath,prefix) {
		const ext = path.extname(sourcePath);
		const extensionInfo = $tw.utils.getFileExtensionInfo(ext);
		const typeInfo = extensionInfo ? $tw.config.contentTypeInfo[extensionInfo.type] : null;
		const data = fs.readFileSync(sourcePath,typeInfo ? typeInfo.encoding : "utf8");
		const fields = {title: sourcePath};
		let tids = self.deserializeTiddlers(ext,data,fields);
		const metafile = `${sourcePath}.meta`;
		if(ext !== ".json" && tids.length === 1 && fs.existsSync(metafile)) {
			const metadata = fs.readFileSync(metafile,"utf8");
			if(metadata) {
				tids = [$tw.utils.parseFields(metadata,tids[0])];
			}
		}
		tids.forEach((tid) => {
			tid.title = prefix + tid.title;
		});
		tiddlers.push.apply(tiddlers,tids);
	};
	const processRecipe = function(sourcePath,text) {
		const recipe = parseRecipe(text);
		for(let t = 0;t < recipe.length;t++) {
			if(recipe[t].name === "recipe") {
				const recipeFile = path.resolve(path.dirname(sourcePath),recipe[t].value);
				processRecipe(recipeFile,fs.readFileSync(recipeFile,"utf8"));
			} else {
				const tiddlerFile = path.resolve(path.dirname(sourcePath),recipe[t].value);
				loadTiddlersFromFile(tiddlerFile,`{${recipe[t].name}}`);
			}
		}
	};
	const sourcePath = fields.title; // Bit of a hack to take advantage of the default title being the path to the tiddler file
	processRecipe(sourcePath,text);
	// Add a $:/RecipeTiddlers tiddler with the titles of the loaded tiddlers in order
	const titles = [];
	$tw.utils.each(tiddlers,(tiddler) => {
		titles.push(tiddler.title);
	});
	tiddlers.push({
		title: "$:/RecipeTiddlers",
		list: $tw.utils.stringifyList(titles)
	});
	return tiddlers;
};
