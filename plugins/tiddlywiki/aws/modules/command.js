/*\
title: $:/plugins/tiddlywiki/aws/command.js
type: application/javascript
module-type: command

--aws command

\*/

"use strict";

let async;
let awsUtils;

exports.info = {
	name: "aws",
	synchronous: false
};

const Command = function(params,commander,callback) {
	async = require("$:/plugins/tiddlywiki/async/async.js");
	awsUtils = require("$:/plugins/tiddlywiki/aws/utils.js");
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	const self = this;
	const {wiki} = this.commander;
	const subCommand = this.params[0];
	const fn = this.subCommands[subCommand];
	if(!fn) {
		return this.callback("AWS: Unknown subcommand");
	}
	fn.bind(this)();
	return null;
};

Command.prototype.subCommands = {};

// Set credentials profile
Command.prototype.subCommands["profile"] = function() {
	const AWS = require("aws-sdk");
	const profile = this.params[1];
	const credentials = new AWS.SharedIniFileCredentials({profile});
	AWS.config.update({credentials});
	this.callback(null);
};

// Load tiddlers from files in an S3 bucket
Command.prototype.subCommands["s3-load"] = function() {
	const self = this;
	const {wiki} = this.commander;
	const region = this.params[1];
	const bucket = this.params[2];
	const filepaths = this.params.slice(3);
	// Check parameters
	if(!region || !bucket) {
		self.callback("Missing parameters");
	}
	async.eachLimit(
		filepaths,
		20,
		(filepath,callback) => {
			awsUtils.getFile(region,bucket,filepath,(err,data) => {
				if(err) {
					return callback(err);
				}
				const tiddlers = self.commander.wiki.deserializeTiddlers(data.type,data.body,{});
				$tw.utils.each(tiddlers,(tiddler) => {
					self.commander.wiki.importTiddler(new $tw.Tiddler(tiddler));
				});
				callback(null);
			});
		},
		(err,results) => {
			self.callback(err,results);
		}
	);
	return null;
};

// Render a tiddler to an S3 bucket
Command.prototype.subCommands["s3-rendertiddler"] = function() {
	const self = this;
	const {wiki} = this.commander;
	let title = this.params[1];
	const region = this.params[2];
	const bucket = this.params[3];
	let filename = this.params[4];
	var type = this.params[5] || "text/html";
	const template = this.params[6];
	const zipfilename = this.params[7];
	const saveType = this.params[8] || type;
	const variables = {};
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
	let text = this.commander.wiki.renderTiddler(type,title,{variables});
	var type = "text/plain";
	const {encoding} = $tw.config.contentTypeInfo[type] || {encoding: "utf8"};
	// Zip it if needed
	if(zipfilename) {
		const JSZip = require("$:/plugins/tiddlywiki/jszip/jszip.js");
		const zip = new JSZip();
		zip.file(filename,new Buffer(text,encoding));
		text = zip.generate({type: "base64"});
		type = "application/zip";
		filename = zipfilename;
	}
	// Save the file
	async.series([
		awsUtils.putFile.bind(null,region,bucket,filename,text,saveType)
	],
		(err,results) => {
			self.callback(err,results);
		});
	return null;
};

Command.prototype.subCommands["s3-rendertiddlers"] = function() {
	const self = this;
	const {wiki} = this.commander;
	const filter = this.params[1];
	const template = this.params[2];
	const region = this.params[3];
	const bucket = this.params[4];
	const filenameFilter = this.params[5];
	const type = this.params[6] || "text/html";
	const saveTypeFilter = this.params[7] || `[[${type}]]`;
	const tiddlers = wiki.filterTiddlers(filter);
	// Check parameters
	if(!filter || !region || !bucket || !filenameFilter) {
		throw "Missing parameters";
	}
	async.eachLimit(
		tiddlers,
		20,
		(title,callback) => {
			const parser = wiki.parseTiddler(template || title);
			const widgetNode = wiki.makeWidget(parser,{variables: {currentTiddler: title}});
			const container = $tw.fakeDocument.createElement("div");
			widgetNode.render(container,null);
			const text = type === "text/html" ? container.innerHTML : container.textContent;
			const filename = wiki.filterTiddlers(filenameFilter,$tw.rootWidget,wiki.makeTiddlerIterator([title]))[0];
			const saveType = wiki.filterTiddlers(saveTypeFilter,$tw.rootWidget,wiki.makeTiddlerIterator([title]))[0];
			awsUtils.putFile(region,bucket,filename,text,saveType,callback);
		},
		(err,results) => {
			self.callback(err,results);
		}
	);
	return null;
};

// Save a tiddler to an S3 bucket
Command.prototype.subCommands["s3-savetiddler"] = function() {
	const self = this;
	const {wiki} = this.commander;
	const [,title,region,bucket,filenameInit,zipfilename,saveType] = this.params;
	let filename = filenameInit;
	const tiddler = wiki.getTiddler(title);
	let {text} = tiddler.fields;
	let {type} = tiddler.fields;
	const {encoding} = $tw.config.contentTypeInfo[type] || {encoding: "utf8"};
	// Check parameters
	if(!title || !region || !bucket || !filename) {
		throw "Missing parameters";
	}
	// Zip it if needed
	if(zipfilename) {
		const JSZip = require("$:/plugins/tiddlywiki/jszip/jszip.js");
		const zip = new JSZip();
		zip.file(filename,new Buffer(text,encoding));
		text = zip.generate({type: "base64"});
		type = "application/zip";
		filename = zipfilename;
	}
	// Save the file
	async.series([
		awsUtils.putFile.bind(null,region,bucket,filename,text,saveType || type)
	],
		(err,results) => {
			self.callback(err,results);
		});
	return null;
};

// Save a tiddler to an S3 bucket
Command.prototype.subCommands["s3-savetiddlers"] = function() {
	const self = this;
	const {wiki} = this.commander;
	const filter = this.params[1];
	const region = this.params[2];
	const bucket = this.params[3];
	const filenameFilter = this.params[4];
	const saveTypeFilter = this.params[5] || "[is[tiddler]get[type]]";
	const tiddlers = wiki.filterTiddlers(filter);
	// Check parameters
	if(!filter || !region || !bucket || !filenameFilter) {
		throw "Missing parameters";
	}
	async.eachLimit(
		tiddlers,
		20,
		(title,callback) => {
			const tiddler = wiki.getTiddler(title);
			if(tiddler) {
				const text = tiddler.fields.text || "";
				const type = tiddler.fields.type || "text/vnd.tiddlywiki";
				const filename = wiki.filterTiddlers(filenameFilter,$tw.rootWidget,wiki.makeTiddlerIterator([title]))[0];
				const saveType = wiki.filterTiddlers(saveTypeFilter,$tw.rootWidget,wiki.makeTiddlerIterator([title]))[0];
				awsUtils.putFile(region,bucket,filename,text,saveType || type,callback);
			} else {
				process.nextTick(callback,null);
			}
		},
		(err,results) => {
			self.callback(err,results);
		}
	);
	return null;
};

exports.Command = Command;
