/*\
title: $:/core/modules/publishers/filesystem.js
type: application/javascript
module-type: publisher

Handles publishing to the Node.js filesystem

\*/
(function(){

	/*jslint node: true, browser: true */
	/*global $tw: false */
	"use strict";
	
	exports.name = "filesystem";
	
	exports.create = function(params,publisherHandler,publishingJob) {
		return new FileSystemPublisher(params,publisherHandler,publishingJob);
	};
	
	function FileSystemPublisher(params,publisherHandler,publishingJob) {
		this.params = params;
		this.publisherHandler = publisherHandler;
		this.publishingJob = publishingJob;
	};
	
	FileSystemPublisher.prototype.publishStart = function(callback) {
		console.log("publishStart");
		// Returns a list of the previously published files
		callback([]);
	};
	
	FileSystemPublisher.prototype.publishFile = function(item,callback) {
		var fs = require("fs"),
			path = require("path"),
			filepath = path.resolve(this.publishingJob.commander.outputPath,item.path);
		$tw.utils.createFileDirectories(filepath);
		fs.writeFile(filepath,item.text,item.isBase64 ? "base64" : "utf8",function(err) {
			if(err) {
				console.log("File writing error",err)
			}
			callback(err);
		});
	};
	
	FileSystemPublisher.prototype.publishEnd = function(callback) {
		console.log("publishEnd");
		callback(null);
	};
	
	})();
	