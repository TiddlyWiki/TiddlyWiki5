/*\
title: $:/plugins/tiddlywiki/aws/command.js
type: application/javascript
module-type: command

--aws command

\*/

"use strict";

var async,
	awsUtils;

exports.info = {
	name: "aws",
	synchronous: false
};

var Command = function(params,commander,callback) {
	async = require("$:/plugins/tiddlywiki/async/async.js");
	awsUtils = require("$:/plugins/tiddlywiki/aws/utils.js");
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	var self = this,
		wiki = this.commander.wiki,
		subCommand = this.params[0],
		fn = this.subCommands[subCommand];
	if(!fn) {
		return this.callback("AWS: Unknown subcommand")
	}
	fn.bind(this)();
	return null;
};

Command.prototype.subCommands = {};

// Set credentials profile
Command.prototype.subCommands["profile"] = function() {
	var AWS = require("aws-sdk"),
		profile = this.params[1],
		credentials = new AWS.SharedIniFileCredentials({profile: profile});
	AWS.config.update({credentials: credentials});
	this.callback(null);
};

// Load tiddlers from files in an S3 bucket
Command.prototype.subCommands["s3-load"] = function() {
	var self = this,
		wiki = this.commander.wiki,
		region = this.params[1],
		bucket = this.params[2],
		filepaths = this.params.slice(3);
	// Check parameters
	if(!region || !bucket) {
		self.callback("Missing parameters");
	}
	async.eachLimit(
		filepaths,
		20,
		function(filepath,callback) {
			awsUtils.getFile(region,bucket,filepath,function(err,data) {
				if(err) {
					return callback(err);
				}
				var tiddlers = self.commander.wiki.deserializeTiddlers(data.type,data.body,{});
				$tw.utils.each(tiddlers,function(tiddler) {
					self.commander.wiki.importTiddler(new $tw.Tiddler(tiddler));
				});
				callback(null);
			});
		},
		function(err,results) {
			self.callback(err,results);
		}
	);
	return null;
};

// Render a tiddler to an S3 bucket
Command.prototype.subCommands["s3-rendertiddler"] = function() {
	var self = this,
		wiki = this.commander.wiki,
		title = this.params[1],
		region = this.params[2],
		bucket = this.params[3],
		filename = this.params[4],
		type = this.params[5] || "text/html",
		template = this.params[6],
		zipfilename = this.params[7],
		saveType = this.params[8] || type,
		variables = {};
	// Check parameters
	if(!title || !region || !bucket || !filename) {
		throw "Missing parameters";
	}
	// Process the template if present
	if(template) {
		variables.currentTiddler = title;
		title = template;
	}
	// Render the tiddler
	var text = this.commander.wiki.renderTiddler(type,title,{variables: variables}),
		type = "text/plain",
		encoding = ($tw.config.contentTypeInfo[type] || {encoding: "utf8"}).encoding;
	// Zip it if needed
	if(zipfilename) {
		var JSZip = require("$:/plugins/tiddlywiki/jszip/jszip.js"),
			zip = new JSZip();
		zip.file(filename,new Buffer(text,encoding));
		text = zip.generate({type: "base64"});
		type = "application/zip";
		filename = zipfilename;
	}
	// Save the file
	async.series([
		awsUtils.putFile.bind(null,region,bucket,filename,text,saveType)
	],
	function(err,results){
		self.callback(err,results);
	});
	return null;
};

Command.prototype.subCommands["s3-rendertiddlers"] = function() {
	var self = this,
		wiki = this.commander.wiki,
		filter = this.params[1],
		template = this.params[2],
		region = this.params[3],
		bucket = this.params[4],
		filenameFilter = this.params[5],
		type = this.params[6] || "text/html",
		saveTypeFilter = this.params[7] || "[[" + type + "]]",
		tiddlers = wiki.filterTiddlers(filter);
	// Check parameters
	if(!filter || !region || !bucket || !filenameFilter) {
		throw "Missing parameters";
	}
	async.eachLimit(
		tiddlers,
		20,
		function(title,callback) {
			var parser = wiki.parseTiddler(template || title),
				widgetNode = wiki.makeWidget(parser,{variables: {currentTiddler: title}}),
				container = $tw.fakeDocument.createElement("div");
			widgetNode.render(container,null);
			var text = type === "text/html" ? container.innerHTML : container.textContent,
				filename = wiki.filterTiddlers(filenameFilter,$tw.rootWidget,wiki.makeTiddlerIterator([title]))[0],
				saveType = wiki.filterTiddlers(saveTypeFilter,$tw.rootWidget,wiki.makeTiddlerIterator([title]))[0];
			awsUtils.putFile(region,bucket,filename,text,saveType,callback);
		},
		function(err,results) {
			self.callback(err,results);
		}
	);
	return null;
};

// Save a tiddler to an S3 bucket
Command.prototype.subCommands["s3-savetiddler"] = function() {
	var self = this,
		wiki = this.commander.wiki,
		title = this.params[1],
		region = this.params[2],
		bucket = this.params[3],
		filename = this.params[4],
		zipfilename = this.params[5],
		saveType = this.params[6],
		tiddler = wiki.getTiddler(title),
		text = tiddler.fields.text,
		type = tiddler.fields.type,
		encoding = ($tw.config.contentTypeInfo[type] || {encoding: "utf8"}).encoding;
	// Check parameters
	if(!title || !region || !bucket || !filename) {
		throw "Missing parameters";
	}
	// Zip it if needed
	if(zipfilename) {
		var JSZip = require("$:/plugins/tiddlywiki/jszip/jszip.js"),
			zip = new JSZip();
		zip.file(filename,new Buffer(text,encoding));
		text = zip.generate({type: "base64"});
		type = "application/zip";
		filename = zipfilename;
	}
	// Save the file
	async.series([
		awsUtils.putFile.bind(null,region,bucket,filename,text,saveType || type)
	],
	function(err,results){
		self.callback(err,results);
	});
	return null;
};

// Save a tiddler to an S3 bucket
Command.prototype.subCommands["s3-savetiddlers"] = function() {
	var self = this,
		wiki = this.commander.wiki,
		filter = this.params[1],
		region = this.params[2],
		bucket = this.params[3],
		filenameFilter = this.params[4],
		saveTypeFilter = this.params[5] || "[is[tiddler]get[type]]",
		tiddlers = wiki.filterTiddlers(filter);
	// Check parameters
	if(!filter || !region || !bucket || !filenameFilter) {
		throw "Missing parameters";
	}
	async.eachLimit(
		tiddlers,
		20,
		function(title,callback) {
			var tiddler = wiki.getTiddler(title);
			if(tiddler) {
				var text = tiddler.fields.text || "",
					type = tiddler.fields.type || "text/vnd.tiddlywiki",
					filename = wiki.filterTiddlers(filenameFilter,$tw.rootWidget,wiki.makeTiddlerIterator([title]))[0],
					saveType = wiki.filterTiddlers(saveTypeFilter,$tw.rootWidget,wiki.makeTiddlerIterator([title]))[0];
				awsUtils.putFile(region,bucket,filename,text,saveType || type,callback);				
			} else {
				process.nextTick(callback,null);
			}
		},
		function(err,results) {
			self.callback(err,results);
		}
	);
	return null;
};

exports.Command = Command;
