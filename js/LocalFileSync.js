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
	this.changeCounts = {}; // A hashmap of <tiddlername>: <changeCount>
	var self = this;
	// Set up a queue for loading tiddler files
	this.loadQueue = async.queue(function(task,callback) {
		retrieveFile(task.filepath,self.dirpath,function(err,data) {
			if(err) {
				callback(err);
			} else {
				// Use the filepath as the default title and src for the tiddler
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
								self.changeCounts[tiddler.title] = self.store.getChangeCount(tiddler.title);
							}
						};
			for(var t=0; t<files.length; t++) {
				var f = files[t];
				if(["..",".",".DS_Store"].indexOf(f) === -1 && f.indexOf(".meta") !== f.length-5) {
					self.loadQueue.push({
						filepath: path.resolve(self.dirpath,f),
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
			data = new Buffer(task.data,"base64").toString("binary"),
			encoding = "binary";
		}
		fs.writeFile(self.dirpath + "/" + task.name,data,encoding,function(err) {
			callback(err);
		});
	},10);
	// Install our event listener to listen out for tiddler changes
	this.store.addEventListener("",function(changes) {
		for(var title in changes) {
			// Get the information about the tiddler
			var tiddler = self.store.getTiddler(title),
				changeCount = self.store.getChangeCount(title),
				lastChangeCount = self.changeCounts[title],
				files = [];
			// Construct a changecount record if we don't have one
			if(!lastChangeCount) {
				lastChangeCount = 0;
				self.changeCounts[title] = lastChangeCount; 
			}
			// Save the tiddler if the changecount has increased
			if(changeCount > lastChangeCount) {
				files = self.store.serializeTiddlers([tiddler],"application/x-tiddler");
				for(var t=0; t<files.length; t++) {
					self.saveQueue.push(files[t]);
				}
			}
		}
	});
}

exports.LocalFileSync = LocalFileSync;

})();
