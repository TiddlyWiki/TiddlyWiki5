/*\
title: js/FileStore.js

\*/
(function(){

/*jslint node: true */
"use strict";

var retrieveFile = require("./FileRetriever.js").retrieveFile,
	fs = require("fs"),
	path = require("path"),
	url = require("url"),
	util = require("util"),
	async = require("async");

function FileStore(dirpath,store,callback) {
	this.dirpath = dirpath;
	this.store = store;
	this.callback = callback;
	this.sources = {}; // A hashmap of <tiddlername>: <srcpath>
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
			for(var t=0; t<files.length; t++) {
				var f = files[t];
				if(["..",".",".DS_Store"].indexOf(f) === -1 && f.indexOf(".meta") !== f.length-5) {
					self.loadQueue.push({
						filepath: path.resolve(self.dirpath,f),
						callback: function(task,tiddlers) {
							for(var t=0; t<tiddlers.length; t++) {
								var tiddler = tiddlers[t];
								self.sources[tiddler.title] = task.filepath;
								self.store.addTiddler(tiddler);
							}
						}
					});
				}
			}
		}
	});
}

exports.FileStore = FileStore;

})();
