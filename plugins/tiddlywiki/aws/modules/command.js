/*\
title: $:/plugins/tiddlywiki/aws/command.js
type: application/javascript
module-type: command

--aws command

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
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

// Save a tiddler to an S3 bucket
Command.prototype.subCommands["s3-savetiddler"] = function() {
	var self = this,
		wiki = this.commander.wiki,
		title = this.params[1],
		region = this.params[2],
		bucket = this.params[3],
		filename = this.params[4],
		zipfilename = this.params[5],
		tiddler = wiki.getTiddler(title),
		text = tiddler.fields.text,
		type = tiddler.fields.type,
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
		awsUtils.putFile.bind(null,region,bucket,filename,text,type)
	],
	function(err,results){
		self.callback(err,results);
	});
	return null;
};

exports.Command = Command;

})();

