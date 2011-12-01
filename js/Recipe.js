/*

Recipe files consist of recipe lines consisting of a marker, a colon and the pathname of an ingredient:

marker: pathname

The pathname is interpreted relative to the directory containing the recipe file.

The special marker "recipe" is used to load a sub-recipe file.

The special marker "template" is used to identify the HTML template. The HTML template contains
markers in two different forms:

<!--@@marker@@-->
&lt;!--@@marker@@--&gt;

Recipe processing is in two parts. First the recipe file is parsed and the referenced files are loaded into tiddlers.
Second, the template is processed by replacing the markers with the text of the tiddlers indicated in the recipe file.

The recipe is parsed into the 'ingredients' hashmap like this:

this.ingredients = {
	"marker1": [Tiddler1,Tiddler2,Tiddler3,...],
	"marker2": [TiddlerA,TiddlerB,TiddlerC,...],
	....
};

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
	util = require("util");

// Create a new Recipe object from the specified recipe file, storing the tiddlers in a specified TiddlyWiki store. Invoke
// the callback function when all of the referenced tiddlers and recipes have been loaded successfully
var Recipe = function(store,filepath,callback) {
	this.store = store; // Save a reference to the store
	this.ingredients = {}; // Hashmap of array of ingredients
	this.callback = callback;
	this.fetchCount = 0;
	this.readRecipe(filepath,process.cwd()); // Read the recipe file
};

// The fetch counter is used to keep track of the number of asynchronous requests outstanding
Recipe.prototype.incFetchCount = function() {
	this.fetchCount++;
};

// When the fetch counter reaches zero, all the results are in, so invoke the recipe callback
Recipe.prototype.decFetchCount = function() {
	if(--this.fetchCount === 0) {
		this.callback();
	}
};

// Process the contents of a recipe file
Recipe.prototype.readRecipe = function(filepath,contextPath) {
	var me = this;
	this.incFetchCount();
	var rf = retrieveFile(filepath, contextPath, function(err, data) {
		if (err) throw err;
		me.processRecipe(data,rf.path);
		me.decFetchCount();
	});
};

Recipe.prototype.processRecipe = function (data,contextPath) {
	var me = this;
	data.split("\n").forEach(function(line) {
		var p = line.indexOf(":");
		if(p !== -1) {
			var marker = line.substr(0, p).trim(),
				value = line.substr(p+1).trim();
			if(marker === "recipe") {
				me.readRecipe(value,contextPath);
			} else {
				// Reserve a place in the ingredients array for this ingredient, just to keep tiddler ordering
				// compatible with cook.rb
				if(!(marker in me.ingredients)) {
					me.ingredients[marker] = [];
				}
				var ingredientLocation = me.ingredients[marker].push(null) - 1;
				me.readIngredient(value,contextPath,function(tiddlers) {
					for(var t=0; t<tiddlers.length; t++) {
						var fields = tiddlers[t];
						var postProcess = me.readIngredientPostProcess[marker];
						if(postProcess) {
							fields = postProcess(fields);
						}
						var ingredientTiddler = new Tiddler(fields);
						me.store.addTiddler(ingredientTiddler);
						if(ingredientLocation !== -1) {
							me.ingredients[marker][ingredientLocation] = ingredientTiddler;
							ingredientLocation = -1;
						} else {
							me.ingredients[marker].push(ingredientTiddler);		
						}
					}
				});
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

// Read an ingredient file and callback with an array of hashmaps of tiddler fields. For single
// tiddler files it also looks for an accompanying .meta file
Recipe.prototype.readIngredient = function(filepath,contextPath,callback) {
	var me = this;
	me.incFetchCount();
	// Read the tiddler file
	var rf = retrieveFile(filepath,contextPath,function(err,data) {
		if (err) throw err;
		var fields = {
			title: rf.basename
		};
		var tiddlers = tiddlerInput.parseTiddlerFile(data,rf.extname,fields);
		// Check for the .meta file
		if(rf.extname !== ".json" && tiddlers.length === 1) {
			var metafile = filepath + ".meta";
			me.incFetchCount();
			retrieveFile(metafile,contextPath,function(err,data) {
				if(err && err.code !== "ENOENT" && err.code !== "404") {
					throw err;
				}
				var fields = tiddlers[0];
				if(!err) {
					fields = tiddlerInput.parseMetaDataBlock(data,fields);
				}
				callback([fields]);
				me.decFetchCount();
			});
		} else {
			callback(tiddlers);
		}
		me.decFetchCount();
	});
};

// Return a string of the cooked recipe
Recipe.prototype.cook = function() {
	var template = this.ingredients.template ? this.ingredients.template[0].fields.text : "",
		out = [],
		me = this;
	template.split("\n").forEach(function(line) {
		var templateRegExp = /^(?:<!--@@(.*)@@-->)|(?:&lt;!--@@(.*)@@--&gt;)$/gi;
		var match = templateRegExp.exec(line);
		if(match) {
			var marker = match[1] === undefined ? match[2] : match[1];
			me.outputIngredient(out,marker);
		} else {
			out.push(line);
		}
	});
	return out.join("\n");
};

// Output all the tiddlers in the recipe with a particular marker
Recipe.prototype.outputIngredient = function(out,marker) {
	var ingredient = this.ingredients[marker],
		outputType = Recipe.ingredientOutputMapper[marker] || "raw",
		outputter = Recipe.ingredientOutputter[outputType];
	if(outputter && ingredient) {
		outputter(out,ingredient);
	}
};

// Allows for specialised processing for certain markers
Recipe.ingredientOutputMapper = {
	tiddler: "div",
	js: "javascript",
	jsdeprecated: "javascript",
	jquery: "javascript",
	shadow: "shadow"
};

Recipe.ingredientOutputter = {
	raw: function(out,ingredient) {
		// The default is just to output the raw text of the tiddler, ignoring any metadata
		for(var t=0; t<ingredient.length; t++) {
			var tid = ingredient[t];
			// For compatibility with cook.rb, remove one trailing \n from tiddler
			var text = tid.fields.text;
			text = text.charAt(text.length-1) === "\n" ? text.substr(0,text.length-1) : text;
			out.push(text);
		}
	},
	div: function(out,ingredient) {
		// Ordinary tiddlers are output as a <DIV>
		for(var t=0; t<ingredient.length; t++) {
			var tid = ingredient[t];
			out.push(tiddlerOutput.outputTiddlerDiv(tid));
		}
	},
	javascript: function(out,ingredient) {
		// Lines starting with //# are removed from javascript tiddlers
		for(var t=0; t<ingredient.length; t++) {
			var tid = ingredient[t],
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
	shadow: function(out,ingredient) {
		// Shadows are output as a <DIV> with the the ".shadow" suffix removed from the title
		for(var t=0; t<ingredient.length; t++) {
			var tid = ingredient[t],
				title = tid.fields.title,
				tweakedTiddler;
			if(title.indexOf(".shadow") === title.length - 7) {
				tweakedTiddler = new Tiddler(tid,{
					title: title.substr(0, title.length-7)
				});
			} else {
				tweakedTiddler = tid;
			}
			out.push(tiddlerOutput.outputTiddlerDiv(tweakedTiddler));
		}
	}
};

exports.Recipe = Recipe;

