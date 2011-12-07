/*
TiddlyWiki command line interface
*/

/*global require: false, exports: false, process: false */
"use strict";

var WikiStore = require("./js/WikiStore.js").WikiStore,
	Tiddler = require("./js/Tiddler.js").Tiddler,
	Recipe = require("./js/Recipe.js").Recipe,
	Tiddler = require("./js/Tiddler.js").Tiddler,
	tiddlyWikiInput = require("./js/TiddlyWikiInput.js"),
	tiddlerOutput = require("./js/TiddlerOutput.js"),
	util = require("util"),
	fs = require("fs"),
	path = require("path"),
	aync = require("async"),
	http = require("http");

var parseOptions = function(args,defaultSwitch) {
	var result = [],
		a = 0,
		switchRegExp = /^--([\S]+)$/gi;
	while(a < args.length) {
		switchRegExp.lastIndex = 0;
		var m = switchRegExp.exec(args[a]);
		if(m) {
			a++;
			var switchArgs = [];
			switchRegExp.lastIndex = 0;
			while(a < args.length && !switchRegExp.test(args[a])) {
				switchArgs.push(args[a++]);
			switchRegExp.lastIndex = 0;
			}
			result.push({switch: m[1], args: switchArgs});
		} else {
			result.push({switch: defaultSwitch, args: [args[a++]]});
		}
	}
	return result;
};

var switches = parseOptions(Array.prototype.slice.call(process.argv,2),"dummy"),
	store = new WikiStore(),
	recipe = null,
	lastRecipeFilepath = null,
	currSwitch = 0;

var processNextSwitch = function() {
	if(currSwitch < switches.length) {
		var s = switches[currSwitch++],
			csw = commandLineSwitches[s.switch];
		if(s.args.length < csw.args.min) {
			throw "Command line switch --" + s.switch + " should have a minimum of " + csw.args.min + " arguments"
		}
		if(s.args.length > csw.args.max) {
			throw "Command line switch --" + s.switch + " should have a maximum of " + csw.args.max + " arguments"
		}
		csw.handler(s.args,function (err) {
			if(err) {
				throw err;
			}
			process.nextTick(processNextSwitch);
		});
	}
};

process.nextTick(processNextSwitch);

/*
Each command line switch is represented by a function that takes a string array of arguments and a callback to
be invoked when the switch processing has completed. The only argument to the callback is an error code, or null
for success.
*/
var commandLineSwitches = {
	recipe: {
		args: {min: 1, max: 1},
		handler: function(args,callback) {
			if(recipe) {
				callback("--recipe: Cannot process more than one recipe file");
			} else {
				lastRecipeFilepath = args[0];
				recipe = new Recipe(store,args[0],function() {
					callback(null);
				});
			}
		}
	},
	load: {
		args: {min: 1, max: 1},
		handler: function(args,callback) {
			process.nextTick(function() {callback(null);});
		}
	},
	savewiki: {
		args: {min: 1, max: 1},
		handler: function(args,callback) {
			if(!recipe) {
				callback("--savewiki requires a recipe to be loaded first");
			}
			fs.writeFile(args[0],recipe.cook(),"utf8",function(err) {
				callback(err);
			});
		}
	},
	savetiddlers: {
		args: {min: 1, max: 1},
		handler: function(args,callback) {
			var recipe = [];
			store.forEachTiddler(function(title,tiddler) {
				var filename = encodeURIComponent(tiddler.fields.title.replace(/ /g,"_")) + ".tid";
				fs.writeFileSync(path.resolve(args[0],filename),tiddlerOutput.outputTiddler(tiddler),"utf8");
				recipe.push("tiddler: " + filename + "\n");
			});
			fs.writeFileSync(path.join(args[0],"split.recipe"),recipe.join(""));
			process.nextTick(function() {callback(null);});
		}
	},
	servewiki: {
		args: {min: 0, max: 1},
		handler: function(args,callback) {
			if(!lastRecipeFilepath) {
				callback("--servewiki must be preceded by a --recipe");
			}
			var port = args.length > 0 ? args[0] : 8000;
			// Dumbly, this implementation wastes the recipe processing that happened on the --recipe switch
			http.createServer(function(request, response) {
				response.writeHead(200, {"Content-Type": "text/html"});
				store = new WikiStore();
				recipe = new Recipe(store,lastRecipeFilepath,function() {
					response.end(recipe.cook(), "utf8");	
				});
			}).listen(port);
		}
	},
	servetiddlers: {
		args: {min: 1, max: 1},
		handler: function(args,callback) {
			process.nextTick(function() {callback(null);});
		}
	},
	verbose: {
		args: {min: 0, max: 0},
		handler: function(args,callback) {
			process.nextTick(function() {callback(null);});
		}
	}
};

