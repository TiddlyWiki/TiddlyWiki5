/*

Recipe files consist of recipe lines consisting of a marker, a colon and the pathname of an ingredient:

marker: filepath

The filepath is interpreted relative to the directory containing the recipe file.

The special marker "recipe" is used to load a sub-recipe file.

The special marker "template" is used to identify the HTML template. The HTML template contains
markers in two different forms:

<!--@@marker@@-->
&lt;!--@@marker@@--&gt;

Recipe processing is in four parts:

1) The recipe file is parsed and any subrecipe files loaded recursively into this structure:

	this.recipe = [
		{marker: <marker>, filepath: <filepath>, contextPath: <contextPath>},
		...
		{marker: <marker>, filepath: <filepath>, contextPath: <contextPath>},
		[
			{marker: <marker>, filepath: <filepath>, contextPath: <contextPath>},
			...
			{marker: <marker>, filepath: <filepath>, contextPath: <contextPath>},
		]
	];

2) The tiddler files referenced by the recipe structure are loaded into it as an additional 'tiddlers'
member that contains an array of hashmaps of tiddler field values.

3) The recipe is scanned to create a hashmap of markers and their associated tiddlers. In cases where more
than one tiddler with the same title is assigned to a marker, the one that is later in the recipe file wins.
At this point tiddlers are placed in the store so that they can be referenced by title

	this.markers = {
		<marker>: [<tiddler title>,<tiddler title>,...],
		<marker>: [<tiddler title>,<tiddler title>,...],
		...
	}

4) Finally, the template is processed by replacing the markers with the text of the associated tiddlers

*/

/*global require: false, exports: false, process: false */
"use strict";

var Tiddler = require("./Tiddler.js").Tiddler,
	tiddlerInput = require("./TiddlerInput.js"),
	tiddlerOutput = require("./TiddlerOutput.js"),
	utils = require("./Utils.js"),
	TiddlyWiki = require("./TiddlyWiki.js").TiddlyWiki,
	retrieveFile = require("./FileRetriever.js").retrieveFile,
	fs = require("fs"),
	path = require("path"),
	util = require("util"),
	async = require("async");

// Create a new Recipe object from the specified recipe file, storing the tiddlers in a specified TiddlyWiki store. Invoke
// the callback function when all of the referenced tiddlers and recipes have been loaded successfully
var Recipe = function(store,filepath,callback) {
	var me = this;
	this.store = store; // Save a reference to the store
	this.callback = callback;
	this.recipe = [];
	this.markers = {};
	this.recipeQueue = async.queue(function(task,callback) {
		retrieveFile(task.filepath,task.contextPath,function(err,data) {
			if(err) {
				callback(err);
			} else {
				me.processRecipeFile(task.recipe,data.text,data.path);
				callback(null);
			}
		});
	},1);
	this.tiddlerQueue = async.queue(function(task,callback) {
		me.readTiddlerFile(task.filepath,task.contextPath,function(err,data) {
			if(err) {
				callback(err);
			} else {
				task.recipeLine.tiddlers = data;
				callback(null);
			}
		});
	},1);
	this.recipeQueue.drain = function() {
		me.loadTiddlerFiles(me.recipe);
	};
	this.tiddlerQueue.drain = function() {
		me.chooseTiddlers(me.recipe);
		me.callback();
	};
	this.recipeQueue.push({filepath: filepath,
							contextPath: process.cwd(),
							recipe: this.recipe});
};

Recipe.prototype.loadTiddlerFiles = function(recipe) {
	for(var r=0; r<recipe.length; r++) {
		var recipeLine = recipe[r];
		if(recipeLine instanceof Array) {
			this.loadTiddlerFiles(recipeLine);	
		} else {
			this.tiddlerQueue.push({filepath: recipeLine.filepath, contextPath: recipeLine.contextPath, recipeLine: recipeLine});
		}
	}
};

Recipe.prototype.chooseTiddlers = function(recipe) {
	for(var r=0; r<recipe.length; r++) {
		var recipeLine = recipe[r];
		if(recipeLine instanceof Array) {
			this.chooseTiddlers(recipeLine);
		} else {
			var store = recipeLine.marker === "shadow" ? this.store.shadows : this.store,
				markerArray = this.markers[recipeLine.marker];
			if(markerArray === undefined) {
				this.markers[recipeLine.marker] = [];
				markerArray = this.markers[recipeLine.marker];
			}
			for(var t=0; t<recipeLine.tiddlers.length; t++) {
				// Only add the tiddler to the marker if it isn't already there
				var found = false;
				for(var m=0; m<markerArray.length; m++) {
					if(markerArray[m] === recipeLine.tiddlers[t].title) {
						found = true;
					}
				}
				if(!found) {
					markerArray.push(recipeLine.tiddlers[t].title);
				}	
				store.addTiddler(new Tiddler(recipeLine.tiddlers[t]));
			}
		}		
	}
};

// Process the contents of a recipe file
Recipe.prototype.processRecipeFile = function(recipe,text,contextPath) {
	var me = this;
	text.split("\n").forEach(function(line) {
		var p = line.indexOf(":"),
			insertionPoint;
		if(p !== -1) {
			var marker = line.substr(0, p).trim(),
				value = line.substr(p+1).trim();
			if(marker === "recipe") {
				insertionPoint = recipe.push([]) - 1;
				me.recipeQueue.push({filepath: value, contextPath: contextPath, recipe: recipe[insertionPoint]});
			} else {
				recipe.push({marker: marker, filepath: value, contextPath: contextPath});
			}
		}
	});
};

// Special post-processing required for certain ingredient types
Recipe.prototype.readIngredientPostProcess = {
	"shadow": function(fields) {
		// Add ".shadow" to the name of shadow tiddlers
		fields.title = fields.title + ".shadow";
		return fields;
	}	
};

// Read a tiddler file and callback with an array of hashmaps of tiddler fields. For single
// tiddler files it also looks for an accompanying .meta file
Recipe.prototype.readTiddlerFile = function(filepath,contextPath,callback) {
	var me = this;
	// Read the tiddler file
	retrieveFile(filepath,contextPath,function(err,data) {
		if (err) throw err;
		var fields = {
			title: data.path
		};
		var tiddlers = tiddlerInput.parseTiddlerFile(data.text,data.extname,fields);
		// Check for the .meta file
		if(data.extname !== ".json" && tiddlers.length === 1) {
			var metafile = filepath + ".meta";
			retrieveFile(metafile,contextPath,function(err,data) {
				if(err && err.code !== "ENOENT" && err.code !== "404") {
					callback(err);
				} else {
					var fields = tiddlers[0];
					if(!err) {
						fields = tiddlerInput.parseMetaDataBlock(data.text,fields);
					}
					callback(null,[fields]);
				}
			});
		} else {
			callback(null,tiddlers);
		}
	});
};

// Return a string of the cooked recipe
Recipe.prototype.cook = function() {
	var template = this.markers.template ? this.store.getTiddlerText(this.markers.template[0]) : "",
		out = [],
		me = this;
	template.split("\n").forEach(function(line) {
		var templateRegExp = /^(?:<!--@@(.*)@@-->)|(?:&lt;!--@@(.*)@@--&gt;)$/gi;
		var match = templateRegExp.exec(line);
		if(match) {
			var marker = match[1] === undefined ? match[2] : match[1];
			me.outputTiddlersForMarker(out,marker);
		} else {
			out.push(line);
		}
	});
	return out.join("\n");
};

// Output all the tiddlers in the recipe with a particular marker
Recipe.prototype.outputTiddlersForMarker = function(out,marker) {
	var tiddlers = this.markers[marker],
		outputType = Recipe.tiddlerOutputMapper[marker] || "raw",
		outputter = Recipe.tiddlerOutputter[outputType];
	if(outputter && tiddlers) {
		outputter.call(this,out,tiddlers);
	}
};

// Allows for specialised processing for certain markers
Recipe.tiddlerOutputMapper = {
	tiddler: "div",
	js: "javascript",
	jsdeprecated: "javascript",
	jquery: "javascript",
	shadow: "shadow"
};

Recipe.tiddlerOutputter = {
	raw: function(out,tiddlers) {
		// The default is just to output the raw text of the tiddler, ignoring any metadata
		for(var t=0; t<tiddlers.length; t++) {
			// For compatibility with cook.rb, remove one trailing \n from tiddler
			var text = this.store.getTiddlerText(tiddlers[t]);
			text = text.charAt(text.length-1) === "\n" ? text.substr(0,text.length-1) : text;
			out.push(text);
		}
	},
	div: function(out,tiddlers) {
		// Ordinary tiddlers are output as a <DIV>
		for(var t=0; t<tiddlers.length; t++) {
			var tid = this.store.getTiddler(tiddlers[t]);
			out.push(tiddlerOutput.outputTiddlerDiv(tid));
		}
	},
	javascript: function(out,tiddlers) {
		// Lines starting with //# are removed from javascript tiddlers
		for(var t=0; t<tiddlers.length; t++) {
			var tid = this.store.getTiddler(tiddlers[t]),
				text = tid.fields.text;
			// For compatibility with cook.rb, remove one trailing \n from tiddler
			text = text.charAt(text.length-1) === "\n" ? text.substr(0,text.length-1) : text;
			var lines = text.split("\n");
			for(var line=0; line<lines.length; line++) {
				var commentRegExp = /^\s*\/\/#/gi;
				if(!commentRegExp.test(lines[line])) {
					out.push(lines[line]);	
				}
			}	
		}
	},
	shadow: function(out,tiddlers) {
		for(var t=0; t<tiddlers.length; t++) {
			var title = tiddlers[t],
				tid = this.store.shadows.getTiddler(title);
			out.push(tiddlerOutput.outputTiddlerDiv(tid));
		}
	}
};

exports.Recipe = Recipe;

