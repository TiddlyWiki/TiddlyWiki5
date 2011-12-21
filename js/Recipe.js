/*\
title: js/Recipe.js

FileRetriever can asynchronously retrieve files from HTTP URLs or the local file system

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

var Recipe = function(options,callback) {
	var me = this;
	this.filepath = options.filepath;
	this.store = options.store;
	this.tiddlerConverters = options.tiddlerConverters;
	this.textProcessors = options.textProcessors;
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
				if(task.recipeLine.fields) {
					for(var t=0; t<data.length; t++) {
						for(var f in task.recipeLine.fields) {
							data[t][f] = task.recipeLine.fields[f];
						}
					}
				}
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
		me.sortTiddlersForMarker("tiddler");
		me.callback(null);
	};
	this.recipeQueue.push({filepath: this.filepath,
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

Recipe.prototype.sortTiddlersForMarker = function(marker) {
	if(this.markers[marker]) {
		this.markers[marker].sort();
	}	
};

// Process the contents of a recipe file
Recipe.prototype.processRecipeFile = function(recipe,text,contextPath) {
	var matchLine = function(linetext) {
			var lineRegExp = /^(\s*)([^\s\:]+)\s*:\s*(.+)*\s*$/,
				match = lineRegExp.exec(linetext);
			return match ? {
				indent: match[1],
				marker: match[2],
				value: match[3]
			} : null;
		},
		lines = text.split("\n"),
		line = 0;
	while(line < lines.length) {
		var linetext = lines[line++],
			match = matchLine(linetext);
		if(match) {
			if(match.indent.length > 0) {
				throw "Unexpected indentation in recipe file";
			}
			if(match.marker === "recipe") {
				var insertionPoint = recipe.push([]) - 1;
				this.recipeQueue.push({filepath: match.value, contextPath: contextPath, recipe: recipe[insertionPoint]});
			} else {
				var fieldLines = [],
					fieldMatch = matchLine(lines[line]);
				while(fieldMatch && fieldMatch.indent.length > 0) {
					fieldLines.push(lines[line++]);
					fieldMatch = matchLine(lines[line]);
				}
				var fields = {};
				if(fieldLines.length > 0) {
					fields = this.tiddlerConverters.deserialize("application/x-tiddler",fieldLines.join("\n"),{})[0];
				}
				recipe.push({marker: match.marker, filepath: match.value, contextPath: contextPath, fields: fields});
			}
		}
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
		var tiddlers = me.tiddlerConverters.deserialize(data.extname,data.text,fields);
		// Check for the .meta file
		if(data.extname !== ".json" && tiddlers.length === 1) {
			var metafile = filepath + ".meta";
			retrieveFile(metafile,contextPath,function(err,data) {
				if(err && err.code !== "ENOENT" && err.code !== "404") {
					callback(err);
				} else {
					var fields = tiddlers[0];
					if(!err) {
						var text = data.text.split("\n\n")[0];
						if(text) {
							fields = me.tiddlerConverters.deserialize("application/x-tiddler",text,fields)[0];
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
	if(!tiddlers) {
		tiddlers = [];
	}
	if(outputter) {
		outputter.call(this,out,tiddlers);
	}
};

// Allows for specialised processing for certain markers
Recipe.tiddlerOutputMapper = {
	tiddler: "div",
	js: "javascript",
	jsdeprecated: "javascript",
	jquery: "javascript",
	shadow: "shadow",
	title: "title",
	jsmodule: "jsmodule"
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
			out.push(this.tiddlerConverters.serialize("application/x-tiddler-html-div",tid));
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
			out.push(this.tiddlerConverters.serialize("application/x-tiddler-html-div",tid));
		}
	},
	title: function(out,tiddlers) {
		out.push(this.store.renderTiddler("text/plain","WindowTitle"));
	},
	jsmodule: function(out,tiddlers) {
		// JavaScript modules are output as a special script tag
		for(var t=0; t<tiddlers.length; t++) {
			var title = tiddlers[t],
				tid = this.store.getTiddler(title);
			out.push("<" + "script type=\"application/javascript\">");
			out.push("define(\"" + title + "\",function(require,exports,module) {");
			out.push(tid.fields.text);
			out.push("});");
			out.push("</" + "script>");
		}
	}
};

// Cook an RSS file of the most recent 20 tiddlers
Recipe.prototype.cookRss = function()
{
	var me = this,
		numRssItems = 20,
		s = [],
		d = new Date(),
		u = this.store.renderTiddler("text/plain","SiteUrl"),
		encodeTiddlyLink = function(title) {
			return title.indexOf(" ") == -1 ? title : "[[" + title + "]]";
		},
		tiddlerToRssItem = function(tiddler,uri) {
			var s = "<title" + ">" + utils.htmlEncode(tiddler.fields.title) + "</title" + ">\n";
			s += "<description>" + utils.htmlEncode(me.store.renderTiddler("text/html",tiddler.fields.title)) + "</description>\n";
			var i;
			if(tiddler.fields.tags) {
				for(i=0; i<tiddler.fields.tags.length; i++) {
					s += "<category>" + tiddler.fields.tags[i] + "</category>\n";
				}
			}
			s += "<link>" + uri + "#" + encodeURIComponent(encodeTiddlyLink(tiddler.fields.title)) + "</link>\n";
			if(tiddler.fields.modified) {
				s +="<pubDate>" + tiddler.fields.modified.toUTCString() + "</pubDate>\n";
			}
			return s;
		},
		getRssTiddlers = function(sortField,excludeTag) {
			var r = [];
			me.store.forEachTiddler(sortField,excludeTag,function(title,tiddler) {
				if(!tiddler.hasTag(excludeTag)) {
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
