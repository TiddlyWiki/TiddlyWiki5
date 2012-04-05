(function(){

/*
TiddlyWiki command line interface
*/

/*jslint node: true */
"use strict";

var App = require("./js/App.js").App,
	WikiStore = require("./js/WikiStore.js").WikiStore,
	LocalFileSync = require("./js/LocalFileSync.js").LocalFileSync,
	Tiddler = require("./js/Tiddler.js").Tiddler,
	Recipe = require("./js/Recipe.js").Recipe,
	tiddlerInput = require("./js/TiddlerInput.js"),
	tiddlerOutput = require("./js/TiddlerOutput.js"),
	util = require("util"),
	fs = require("fs"),
	url = require("url"),
	path = require("path"),
	aync = require("async"),
	http = require("http");

var app = new App();

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
			result.push({switchName: m[1], args: switchArgs});
		} else {
			result.push({switchName: defaultSwitch, args: [args[a++]]});
		}
	}
	return result;
};

var switches = parseOptions(Array.prototype.slice.call(process.argv,2),"dummy"),
	verbose = false,
	recipe = null,
	localFileSync = null,
	lastRecipeFilepath = null,
	currSwitch = 0;


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
				recipe = new Recipe({
					filepath: args[0],
					store: app.store
				},function(err) {
					callback(err);
				});
			}
		}
	},
	dumpstore: {
		args: {min: 0, max: 0},
		handler: function(args,callback) {
			console.log("Store is:\n%s",util.inspect(app.store,false,10));
			process.nextTick(function() {callback(null);});
		}
	},
	dumprecipe: {
		args: {min: 0, max: 0},
		handler: function(args,callback) {
			console.log("Recipe is:\n%s",util.inspect(recipe,false,10));
			process.nextTick(function() {callback(null);});
		}
	},
	load: {
		args: {min: 1, max: 1},
		handler: function(args,callback) {
			fs.readFile(args[0],"utf8",function(err,data) {
				if(err) {
					callback(err);
				} else {
					var fields = {title: args[0]},
						extname = path.extname(args[0]),
						type = extname === ".html" ? "application/x-tiddlywiki" : extname;
					var tiddlers = app.store.deserializeTiddlers(type,data,fields);
					for(var t=0; t<tiddlers.length; t++) {
						app.store.addTiddler(new Tiddler(tiddlers[t]));
					}
					callback(null);	
				}
			});
		}
	},
	store: {
		args: {min: 1, max: 1},
		handler: function(args,callback) {
			localFileSync = new LocalFileSync(args[0],app.store,function() {
				callback(null);
			});
		}
	},
	savewiki: {
		args: {min: 1, max: 1},
		handler: function(args,callback) {
			if(!recipe) {
				callback("--savewiki requires a recipe to be loaded first");
			}
			fs.writeFile(path.resolve(args[0],"index.html"),recipe.cook(),"utf8",function(err) {
				if(err) {
					callback(err);
				} else {
					fs.writeFile(path.resolve(args[0],"index.xml"),recipe.cookRss(),"utf8",function(err) {
						callback(err);
					});
				}
			});
		}
	},
	savetiddler: {
		args: {min: 2, max: 3},
		handler: function(args,callback) {
			var title = args[0],
				filename = args[1],
				type = args[2] || "text/html";
			fs.writeFileSync(filename,app.store.renderTiddler(type,title),"utf8");
		}	
	},
	savetiddlers: {
		args: {min: 1, max: 2},
		handler: function(args,callback) {
			var outdir = args[0],
				recipe = [];
			app.store.forEachTiddler(function(title,tiddler) {
				var filename = encodeURIComponent(tiddler.title.replace(/ /g,"_")) + ".tid";
				fs.writeFileSync(path.resolve(outdir,filename),app.store.serializeTiddlers([tiddler],"application/x-tiddler")[0].data,"utf8");
				recipe.push("tiddler: " + filename + "\n");
			});
			fs.writeFileSync(path.join(args[0],"split.recipe"),recipe.join(""));
			process.nextTick(function() {callback(null);});
		}
	},
	savehtml: {
		args: {min: 1, max: 1},
		handler: function(args,callback) {
			var outdir = args[0];
			app.store.forEachTiddler(function(title,tiddler) {
				var filename = encodeURIComponent(title.replace(/ /g,"_")) + ".html";
				fs.writeFileSync(path.resolve(outdir,filename),app.store.renderTiddler("text/html",title),"utf8");
			});
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
			http.createServer(function(request, response) {
				var path = url.parse(request.url).pathname;
				switch(request.method) {
					case "PUT":
						var data = "";
						request.on("data",function(chunk) {
							data += chunk.toString();
						});
						request.on("end",function() {
							var title = decodeURIComponent(path.substr(1));
							app.store.addTiddler(new Tiddler(JSON.parse(data),{title: title}));
							response.writeHead(204, "OK");
							response.end();
						});
						break;
					case "DELETE":
						app.store.deleteTiddler(decodeURIComponent(path.substr(1)));
						response.writeHead(204, "OK");
						response.end();
						break;
					case "GET":
						if(path === "/") {
							response.writeHead(200, {"Content-Type": "text/html"});
							response.end(recipe.cook(), "utf8");	
						} else {
							response.writeHead(404);
							response.end();
						}
						break;
					}
			}).listen(port);
			process.nextTick(function() {callback(null);});
		}
	},
	servetiddlers: {
		args: {min: 0, max: 1},
		handler: function(args,callback) {
			var port = args.length > 0 ? args[0] : 8000;
			http.createServer(function (request, response) {
				var title = decodeURIComponent(url.parse(request.url).pathname.substr(1)),
					tiddler = app.store.getTiddler(title);
				if(tiddler) {
					response.writeHead(200, {"Content-Type": "text/html"});
					response.end(app.store.renderTiddler("text/html",title),"utf8");					
				} else {
					response.writeHead(404);
					response.end();
				}
			}).listen(port);
			process.nextTick(function() {callback(null);});
		}
	},
	verbose: {
		args: {min: 0, max: 0},
		handler: function(args,callback) {
			verbose = true;
			process.nextTick(function() {callback(null);});
		}
	},
	wikitest: {
		args: {min: 1, max: 2},
		handler: function(args,callback) {
			var testdirectory = args[0],
				saveResults = args[1] === "save",
				files = fs.readdirSync(testdirectory),
				titles = [],
				f,t,extname,basename;
			for(f=0; f<files.length; f++) {
				extname = path.extname(files[f]);
				if(extname === ".tid") {
					var tiddlers = app.store.deserializeTiddlers(extname,fs.readFileSync(path.resolve(testdirectory,files[f]),"utf8"));
					if(tiddlers.length > 1) {
						throw "Cannot use .JSON files";
					}
					app.store.addTiddler(new Tiddler(tiddlers[0]));
					titles.push(tiddlers[0].title);
				}
			}
			for(t=0; t<titles.length; t++) {
				var htmlFilename = path.resolve(testdirectory,titles[t] + ".html"),
					plainFilename = path.resolve(testdirectory,titles[t] + ".txt"),
					htmlTarget = fs.readFileSync(htmlFilename,"utf8"),
					plainTarget = fs.readFileSync(plainFilename,"utf8"),
					tiddler = app.store.getTiddler(titles[t]),
					htmlRender = app.store.renderTiddler("text/html",titles[t]),
					plainRender = app.store.renderTiddler("text/plain",titles[t]);
				if(saveResults) {
					// Save results
					fs.writeFileSync(htmlFilename,htmlRender,"utf8");
					fs.writeFileSync(plainFilename,plainRender,"utf8");
				} else {
					// Report results
					if(htmlTarget !== htmlRender) {
						console.error("Tiddler %s html error\nTarget: %s\nFound:  %s\n",titles[t],htmlTarget,htmlRender);
					}
					if(plainTarget !== plainRender) {
						console.error("Tiddler %s plain text error\nTarget: %s\nFound:  %s\n",titles[t],plainTarget,plainRender);
					}
				}
			}
			process.nextTick(function() {callback(null);});
		}
	}
};

var processNextSwitch = function() {
	if(currSwitch < switches.length) {
		var s = switches[currSwitch++],
			csw = commandLineSwitches[s.switchName];
		if(s.args.length < csw.args.min) {
			throw "Command line switch --" + s.switchName + " should have a minimum of " + csw.args.min + " arguments";
		}
		if(s.args.length > csw.args.max) {
			throw "Command line switch --" + s.switchName + " should have a maximum of " + csw.args.max + " arguments";
		}
		if(verbose) {
			console.log("Processing --" + s.switchName + " " + s.args.join(" "));
		}
		csw.handler(s.args,function (err) {
			if(err) {
				throw "Error while executing option '--" + s.switchName + "' was:\n" + err;
			}
			process.nextTick(processNextSwitch);
		});
	}
};

process.nextTick(processNextSwitch);

})();
