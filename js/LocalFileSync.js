/*\
title: js/LocalFileSync.js

\*/
(function(){

/*jslint node: true */
"use strict";

var retrieveFile = require("./FileRetriever.js").retrieveFile,
	utils = require("./Utils.js"),
	fs = require("fs"),
	path = require("path"),
	url = require("url"),
	util = require("util"),
	async = require("async");



function LocalFileSync(dirpath,store,callback) {
	this.dirpath = dirpath;
	this.store = store;
	this.callback = callback;
	this.tiddlers = {}; // A hashmap of <tiddlername>: {changeCount: <changeCount>, files: [name]}
	var self = this,
		sanitizeFilepath = function(filepath) {
			return filepath.replace(/\//mg,"-");
		};
	// Set up a queue for loading tiddler files, tasks are {filepath:,callback:}
	this.loadQueue = async.queue(function(task,callback) {
		task.files = [];
		retrieveFile(task.filepath,self.dirpath,function(err,data) {
			if(err) {
				callback(err);
			} else {
				task.files.push(task.filepath);
				// Use the filepath as the default title for the tiddler
				var fields = {
					title: data.path
				};
				var tiddlers = self.store.deserializeTiddlers(data.extname,data.text,fields);
				// Check for the .meta file
				if(data.extname !== ".json" && tiddlers.length === 1) {
					var metafile = task.filepath + ".meta";
					retrieveFile(metafile,self.dirpath,function(err,data) {
						if(err && err.code !== "ENOENT" && err.code !== "404") {
							callback(err);
						} else {
							task.files.push(metafile);
							var fields = tiddlers[0];
							if(!err) {
								var text = data.text.split("\n\n")[0];
								if(text) {
									fields = self.store.deserializeTiddlers("application/x-tiddler",text,fields)[0];
								}
							}
							task.callback(task,[fields]);
							callback(null);
						}
					});
				} else {
					task.callback(task,tiddlers);
					callback(null);
				}
			}
		});
	},10);
	// Call the callback when all the files are loaded
	this.loadQueue.drain = function() {
		callback(null);
	};
	// Query the folder content to get all the tiddlers
	fs.readdir(this.dirpath,function(err,files) {
		if(err) {
			callback(err);
		} else {
			var loadCallback = function(task,tiddlers) {
							for(var t=0; t<tiddlers.length; t++) {
								var tiddler = tiddlers[t];
								self.store.addTiddler(tiddler);
								self.tiddlers[tiddler.title] = {
									changeCount: self.store.getChangeCount(tiddler.title),
									files: task.files
								};
							}
						};
			for(var t=0; t<files.length; t++) {
				var f = files[t];
				if(["..",".",".DS_Store"].indexOf(f) === -1 && f.indexOf(".meta") !== f.length-5) {
					self.loadQueue.push({
						filepath: f,
						callback: loadCallback
					});
				}
			}
		}
	});
	// Set up a queue for saving tiddler files
	this.saveQueue = async.queue(function(task,callback) {
		var data = task.data,
			encoding = "utf8";
		if(task.binary) {
			data = new Buffer(task.data,"base64").toString("binary");
			encoding = "binary";
		}
		fs.writeFile(self.dirpath + "/" + task.name,data,encoding,function(err) {
			callback(err);
		});
	},10);
	// Install our event listener to listen out for tiddler changes
	this.store.addEventListener("",function(changes) {
		var t;
		for(var title in changes) {
			// Get the information about the tiddler
			var tiddler = self.store.getTiddler(title),
				changeCount = self.store.getChangeCount(title),
				tiddlerInfo = self.tiddlers[title],
				files = [];
			if(tiddler) {
				// Construct a changecount record if we don't have one
				if(!tiddlerInfo) {
					tiddlerInfo = {changeCount: 0, files: []};
					self.tiddlers[title] = tiddlerInfo; 
				}
				// Save the tiddler if the changecount has increased
				if(changeCount > tiddlerInfo.changeCount) {
					files = self.store.serializeTiddlers([tiddler],"application/x-tiddler");
					for(t=0; t<files.length; t++) {
						files[t].name = sanitizeFilepath(files[t].name);
						tiddlerInfo.files.push(files[t].name);
						self.saveQueue.push(files[t]);
					}
				}
			} else {
				// Delete the tiddler file if the tiddler has gone
				if(tiddlerInfo) {
					for(t=0; t<tiddlerInfo.files.length; t++) {
						fs.unlink(self.dirpath + "/" + tiddlerInfo.files[t]);
					}
					delete self.tiddlers[title]; 
				}
			}
		}
	});
}

exports.LocalFileSync = LocalFileSync;

})();
