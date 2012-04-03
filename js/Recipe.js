/*\
title: js/Recipe.js

Recipe processing is in four parts:

1) The recipe file is parsed and any subrecipe files loaded recursively into this structure:

	this.recipe = [
		{marker: <marker>, filepath: <filepath>, baseDir: <baseDir>},
		...
		{marker: <marker>, filepath: <filepath>, baseDir: <baseDir>},
		[
			{marker: <marker>, filepath: <filepath>, baseDir: <baseDir>},
			...
			{marker: <marker>, filepath: <filepath>, baseDir: <baseDir>},
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

4) Finally, to actually cook the recipe, the template is processed by replacing the markers with the text of the associated tiddlers

\*/
(function(){

/*jslint node: true */
"use strict";

var Tiddler = require("./Tiddler.js").Tiddler,
	utils = require("./Utils.js"),
	retrieveFile = require("./FileRetriever.js").retrieveFile,
	fs = require("fs"),
	path = require("path"),
	util = require("util"),
	async = require("async");

/*
Load a recipe file. Arguments are:

	options: See below
	callback: Function to be called when the recipe has been loaded as callback(err), null === success

Options include:

	filepath: The filepath of the recipe file to load. Can be a local path or an HTTP URL
	store: Indicates the WikiStore to use to store the tiddlers (mandatory)

*/
var Recipe = function(options,callback) {
	var me = this;
	this.filepath = options.filepath;
	this.store = options.store;
	this.callback = callback;
	this.recipe = [];
	this.markers = {};
	// A task queue for loading recipe files
	this.recipeQueue = async.queue(function(task,callback) {
		retrieveFile(task.filepath,task.baseDir,function(err,data) {
			if(err) {
				me.callback(err);
			} else {
				callback(me.processRecipeFile(task.recipe,data.text,data.path));
			}
		});
	},1);
	// A task queue for loading tiddler files
	this.tiddlerQueue = async.queue(function(task,callback) {
		me.readTiddlerFile(task.filepath,task.baseDir,function(err,data) {
			if(err) {
				me.callback(err);
			} else {
				if(data.length === 0) {
					callback("Tiddler file '" + task.filepath + "' does not contain any tiddlers");	
				} else {
					if(task.recipeLine.fields) {
						for(var t=0; t<data.length; t++) {
							for(var f in task.recipeLine.fields) {
								data[t][f] = task.recipeLine.fields[f];
							}
						}
					}
					if(!task.recipeLine.tiddlers) {
						task.recipeLine.tiddlers = [];
					}
					Array.prototype.push.apply(task.recipeLine.tiddlers,data);
					callback(null);
				}
			}
		});
	},1);
	// Called when all the recipes have been loaded
	this.recipeQueue.drain = function() {
		// Initiate the loading of the tiddlers referenced by the recipe
		for(var r=0; r<me.recipe.length; r++) {
			me.loadTiddlerFiles(me.recipe[r]);
		}
	};
	// Called when all the tiddlers have been loaded
	this.tiddlerQueue.drain = function() {
		// Select the tiddlers that are associated with each marker
		me.chooseTiddlers(me.recipe);
		// Sort the main content tiddlers (makes it easier to diff TiddlyWiki files)
		me.sortTiddlersForMarker("tiddler");
		me.callback(null);
	};
	// Start the process off by queueing up the loading of the initial recipe
	this.recipeQueue.push({filepath: this.filepath,
							baseDir: process.cwd(),
							recipe: this.recipe});
};

/*
Recursively queue loading the tiddler files referenced by a recipe line
*/
Recipe.prototype.loadTiddlerFiles = function(recipeLine) {
	var me = this;
	if(recipeLine instanceof Array) {
		for(var r=0; r<recipeLine.length; r++) {
			me.loadTiddlerFiles(recipeLine[r]);	
		}
	} else {
		var filepath = recipeLine.filepath, // eg ../js/*.js
			filedir = path.dirname(filepath), // eg ../js
			filename = path.basename(filepath), // eg *.js
			posStar = filename.indexOf("*");
		if(posStar !== -1) {
			var fileRegExp = new RegExp("^" + filename.replace(/[\-\[\]{}()+?.,\\\^$|#\s]/g, "\\$&").replace("*",".*") + "$");
			var files = fs.readdirSync(path.resolve(recipeLine.baseDir,filedir));
			for(var f=0; f<files.length; f++) {
				if(fileRegExp.test(files[f])) {
					me.tiddlerQueue.push({
						filepath: filedir + "/" + files[f],
						baseDir: recipeLine.baseDir,
						recipeLine: recipeLine
					});
				}
			}
		} else {
			me.tiddlerQueue.push({filepath: filepath, baseDir: recipeLine.baseDir, recipeLine: recipeLine});
		}
	}
};

/*
Choose the tiddlers to be included on each marker
*/
Recipe.prototype.chooseTiddlers = function(recipe) {
	// Loop through the lines of the recipe
	for(var r=0; r<recipe.length; r++) {
		var recipeLine = recipe[r];
		if(recipeLine instanceof Array) {
			// Process subrecipes recursively
			this.chooseTiddlers(recipeLine);
		} else {
			// Choose the store and marker array to be used for this marker
			var store = recipeLine.marker === "tiddler" ? this.store : this.store.shadows,
				markerArray = this.markers[recipeLine.marker];
			// Create the marker array if necessary
			if(markerArray === undefined) {
				this.markers[recipeLine.marker] = [];
				markerArray = this.markers[recipeLine.marker];
			}
			if(recipeLine.tiddlers) {
				// Process each of the tiddlers referenced by the recipe line
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
					// Add the tiddler to the store
					store.addTiddler(new Tiddler(recipeLine.tiddlers[t]));
				}
			}
		}		
	}
};

/*
Sort the tiddlers associated with a particular marker
*/
Recipe.prototype.sortTiddlersForMarker = function(marker) {
	if(this.markers[marker]) {
		this.markers[marker].sort();
	}	
};

/*
Process the contents of a recipe file
	recipe: a reference to the array in which to store the recipe contents
	text: the text of the recipe file
	recipePath: the full pathname used to reach the recipe file
The return value is `null` if the operation succeeded, or an error string if not
*/
Recipe.prototype.processRecipeFile = function(recipe,text,recipePath) {
	var matchLine = function(linetext) {
			var lineRegExp = /^(#?)(\s*)(#?)([^\s\:]+)\s*:\s*(.+)*\s*$/,
				match = lineRegExp.exec(linetext);
			return match ? {
				comment: match[1] || match[3],
				indent: match[2],
				marker: match[4],
				value: match[5]
			} : null;
		},
		lines = text.split("\n"),
		line = 0;
	while(line < lines.length) {
		var linetext = lines[line++],
			match = matchLine(linetext);
		if(match && !match.comment) {
			if(match.indent.length > 0) {
				return "Unexpected indentation in recipe file '" + recipePath + "'";
			}
			if(match.marker === "recipe") {
				var insertionPoint = recipe.push([]) - 1;
				this.recipeQueue.push({
					filepath: match.value,
					baseDir: path.dirname(recipePath),
					recipe: recipe[insertionPoint]
				});
			} else {
				var fieldLines = [],
					fieldMatch = matchLine(lines[line]);
				while(fieldMatch && fieldMatch.indent.length > 0) {
					fieldLines.push(lines[line++]);
					fieldMatch = matchLine(lines[line]);
				}
				var fields = {};
				if(fieldLines.length > 0) {
					fields = this.store.deserializeTiddlers("application/x-tiddler",fieldLines.join("\n"),{})[0];
				}
				recipe.push({
					marker: match.marker,
					filepath: match.value,
					baseDir: path.dirname(recipePath),
					fields: fields});
			}
		}
	}
	return null;
};

/*
Read a tiddler file and callback with an array of hashmaps of tiddler fields. For single
tiddler files it also looks for an accompanying .meta file
	filepath: the filepath to the tiddler file (possibly relative)
	baseDir: the base directory from which the filepath is taken
	callback: called on completion as callback(err,data) where data is an array of tiddler fields
*/
Recipe.prototype.readTiddlerFile = function(filepath,baseDir,callback) {
	var me = this;
	// Read the tiddler file
	retrieveFile(filepath,baseDir,function(err,data) {
		if (err) {
			callback(err);
			return;
		}
		// Use the filepath as the default title for the tiddler
		var fields = {
			title: data.path
		};
		var tiddlers = me.store.deserializeTiddlers(data.extname,data.text,fields);
		// Check for the .meta file
		if(data.extname !== ".json" && tiddlers.length === 1) {
			var metafile = filepath + ".meta";
			retrieveFile(metafile,baseDir,function(err,data) {
				if(err && err.code !== "ENOENT" && err.code !== "404") {
					callback(err);
				} else {
					var fields = tiddlers[0];
					if(!err) {
						var text = data.text.split("\n\n")[0];
						if(text) {
							fields = me.store.deserializeTiddlers("application/x-tiddler",text,fields)[0];
						}
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
		templateLines = template.split("\n");
	for(var line=0; line<templateLines.length; line++) {
		var templateRegExp = /^(?:<!--@@(.*)@@-->)|(?:&lt;!--@@(.*)@@--&gt;)$/gi;
		var match = templateRegExp.exec(templateLines[line]);
		if(match) {
			var marker = match[1] === undefined ? match[2] : match[1];
			this.outputTiddlersForMarker(out,marker);
		} else {
			if(line !== templateLines.length-1) {
				out.push(templateLines[line],"\n");
			}
		}
	}
	return out.join("");
};

// Output all the tiddlers in the recipe with a particular marker
Recipe.prototype.outputTiddlersForMarker = function(out,marker) {
	var tiddlers = [],
		outputType = Recipe.tiddlerOutputMapper[marker] || "raw",
		outputter = Recipe.tiddlerOutputter[outputType];
	if(this.markers[marker]) {
		tiddlers = this.markers[marker];
	}
	if(marker === "tiddler") {
		this.store.forEachTiddler(function(title,tiddler) {
			if(tiddlers.indexOf(title) === -1) {
				tiddlers.push(title);
			}
		});
	} 
	if(outputter) {
		if((out.length > 1) && (Recipe.compatibilityCheats[marker] === "suppressLeadingNewline")) {
			var lastLine = out[out.length-1];
			if(lastLine.substr(-1) === "\n") {
				out[out.length-1] = lastLine.substr(0,lastLine.length-1);
			}
		}
		outputter.call(this,out,tiddlers);
		if(Recipe.compatibilityCheats[marker] === "addTrailingNewline") {
			out.push("\n");
		}
	}
};

// Allows for specialised processing for certain markers
Recipe.tiddlerOutputMapper = {
	tiddler: "div",
	js: "javascript",
	jslib: "javascript",
	jsdeprecated: "javascript",
	jquery: "javascript",
	shadow: "shadow",
	title: "title",
	jsmodule: "jsmodule"
};

Recipe.compatibilityCheats = {
	"prehead": "addTrailingNewline",
	"posthead": "addTrailingNewline",
	"prebody": "addTrailingNewline",
	"postscript": "addTrailingNewline",
	"title": "suppressLeadingNewline"
};

Recipe.tiddlerOutputter = {
	raw: function(out,tiddlers) {
		// The default is just to output the raw text of the tiddler, ignoring any metadata
		for(var t=0; t<tiddlers.length; t++) {
			out.push(this.store.getTiddlerText(tiddlers[t]));
		}
	},
	div: function(out,tiddlers) {
		// Ordinary tiddlers are output as a <DIV>
		for(var t=0; t<tiddlers.length; t++) {
			var tid = this.store.getTiddler(tiddlers[t]);
			out.push(this.store.serializeTiddler("application/x-tiddler-html-div",tid),"\n");
		}
	},
	javascript: function(out,tiddlers) {
		// Lines starting with //# are removed from javascript tiddlers
		for(var t=0; t<tiddlers.length; t++) {
			var tid = this.store.getTiddler(tiddlers[t]),
				text = tid.text;
			var lines = text.split("\n");
			for(var line=0; line<lines.length; line++) {
				var commentRegExp = /^\s*\/\/#/gi;
				if(!commentRegExp.test(lines[line])) {
					out.push(lines[line]);
					if(line !== lines.length-1)	{
						out.push("\n");
					}
				}
			}	
		}
	},
	shadow: function(out,tiddlers) {
		for(var t=0; t<tiddlers.length; t++) {
			var title = tiddlers[t],
				tid = this.store.shadows.getTiddler(title);
			out.push(this.store.serializeTiddler("application/x-tiddler-html-div",tid),"\n");
		}
	},
	title: function(out,tiddlers) {
		out.push(" ",this.store.renderTiddler("text/plain","WindowTitle")," ");
	},
	jsmodule: function(out,tiddlers) {
		// JavaScript modules are output as a special script tag
		for(var t=0; t<tiddlers.length; t++) {
			var title = tiddlers[t],
				tid = this.store.getTiddler(title);
			out.push("<" + "script type=\"application/javascript\" data-tiddler-title=\"" + title + "\">");
			out.push("define(\"" + title + "\",function(require,exports,module) {");
			out.push(tid.text);
			out.push("});");
			out.push("</" + "script>");
		}
	}
};

// Cook an RSS file of the most recent 20 tiddlers
Recipe.prototype.cookRss = function() {
	var me = this,
		numRssItems = 20,
		s = [],
		d = new Date(),
		u = this.store.renderTiddler("text/plain","SiteUrl"),
		encodeTiddlyLink = function(title) {
			return title.indexOf(" ") == -1 ? title : "[[" + title + "]]";
		},
		tiddlerToRssItem = function(tiddler,uri) {
			var s = "<title" + ">" + utils.htmlEncode(tiddler.title) + "</title" + ">\n";
			s += "<description>" + utils.htmlEncode(me.store.renderTiddler("text/html",tiddler.title)) + "</description>\n";
			var i;
			if(tiddler.tags) {
				for(i=0; i<tiddler.tags.length; i++) {
					s += "<category>" + tiddler.tags[i] + "</category>\n";
				}
			}
			s += "<link>" + uri + "#" + encodeURIComponent(encodeTiddlyLink(tiddler.title)) + "</link>\n";
			if(tiddler.modified) {
				s +="<pubDate>" + tiddler.modified.toUTCString() + "</pubDate>\n";
			}
			return s;
		},
		getRssTiddlers = function(sortField,excludeTag) {
			var r = [];
			me.store.forEachTiddler(sortField,excludeTag,function(title,tiddler) {
				if(!tiddler.hasTag(excludeTag) && tiddler.modified !== undefined) {
					r.push(tiddler);
				}
			});
			return r;
		};
	// Assemble the header
	s.push("<" + "?xml version=\"1.0\"?" + ">");
	s.push("<rss version=\"2.0\">");
	s.push("<channel>");
	s.push("<title" + ">" + utils.htmlEncode(this.store.renderTiddler("text/plain","SiteTitle")) + "</title" + ">");
	if(u)
		s.push("<link>" + utils.htmlEncode(u) + "</link>");
	s.push("<description>" + utils.htmlEncode(this.store.renderTiddler("text/plain","SiteSubtitle")) + "</description>");
	//s.push("<language>" + config.locale + "</language>");
	s.push("<pubDate>" + d.toUTCString() + "</pubDate>");
	s.push("<lastBuildDate>" + d.toUTCString() + "</lastBuildDate>");
	s.push("<docs>http://blogs.law.harvard.edu/tech/rss</docs>");
	s.push("<generator>https://github.com/Jermolene/cook.js</generator>");
	// The body
	var tiddlers = getRssTiddlers("modified","excludeLists");
	var i,n = numRssItems > tiddlers.length ? 0 : tiddlers.length-numRssItems;
	for(i=tiddlers.length-1; i>=n; i--) {
		s.push("<item>\n" + tiddlerToRssItem(tiddlers[i],u) + "\n</item>");
	}
	// And footer
	s.push("</channel>");
	s.push("</rss>");
	// Save it all
	return s.join("\n");
};

exports.Recipe = Recipe;

})();
