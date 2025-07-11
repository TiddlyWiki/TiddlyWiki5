/*\
title: $:/core/modules/commands/fetch.js
type: application/javascript
module-type: command

Commands to fetch external tiddlers

\*/

"use strict";

exports.info = {
	name: "fetch",
	synchronous: false
};

const Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	if(this.params.length < 2) {
		return "Missing subcommand and url";
	}
	switch(this.params[0]) {
		case "raw-file": {
			return this.fetchFiles({
				raw: true,
				url: this.params[1],
				transformFilter: this.params[2] || "",
				callback: this.callback
			});
			break;
		}
		case "file": {
			return this.fetchFiles({
				url: this.params[1],
				importFilter: this.params[2],
				transformFilter: this.params[3] || "",
				callback: this.callback
			});
			break;
		}
		case "raw-files": {
			return this.fetchFiles({
				raw: true,
				urlFilter: this.params[1],
				transformFilter: this.params[2] || "",
				callback: this.callback
			});
			break;
		}
		case "files": {
			return this.fetchFiles({
				urlFilter: this.params[1],
				importFilter: this.params[2],
				transformFilter: this.params[3] || "",
				callback: this.callback
			});
			break;
		}
	}
	return null;
};

Command.prototype.fetchFiles = function(options) {
	const self = this;
	// Get the list of URLs
	let urls;
	if(options.url) {
		urls = [options.url];
	} else if(options.urlFilter) {
		urls = this.commander.wiki.filterTiddlers(options.urlFilter);
	} else {
		return "Missing URL";
	}
	// Process each URL in turn
	let next = 0;
	const getNextFile = function(err) {
		if(err) {
			return options.callback(err);
		}
		if(next < urls.length) {
			self.fetchFile(urls[next++],options,getNextFile);
		} else {
			options.callback(null);
		}
	};
	getNextFile(null);
	// Success
	return null;
};

Command.prototype.fetchFile = function(url,options,callback,redirectCount) {
	if(redirectCount > 10) {
		return callback(`Error too many redirects retrieving ${url}`);
	}
	const self = this;
	const lib = url.substr(0,8) === "https://" ? require("https") : require("http");
	lib.get(url).on("response",(response) => {
		const type = (response.headers["content-type"] || "").split(";")[0];
		const data = [];
		self.commander.write(`Reading ${url}: `);
		response.on("data",(chunk) => {
			data.push(chunk);
			self.commander.write(".");
		});
		response.on("end",() => {
			self.commander.write("\n");
			if(response.statusCode === 200) {
				self.processBody(Buffer.concat(data),type,options,url);
				callback(null);
			} else {
				if(response.statusCode === 302 || response.statusCode === 303 || response.statusCode === 307) {
					return self.fetchFile(response.headers.location,options,callback,redirectCount + 1);
				} else {
					return callback(`Error ${response.statusCode} retrieving ${url}`);
				}
			}
		});
		response.on("error",(e) => {
			console.log(`Error on GET request: ${e}`);
			callback(e);
		});
	});
	return null;
};

Command.prototype.processBody = function(body,type,options,url) {
	const self = this;
	// Collect the tiddlers in a wiki
	const incomingWiki = new $tw.Wiki();
	if(options.raw) {
		const typeInfo = type ? $tw.config.contentTypeInfo[type] : null;
		const encoding = typeInfo ? typeInfo.encoding : "utf8";
		incomingWiki.addTiddler(new $tw.Tiddler({
			title: url,
			type,
			text: body.toString(encoding)
		}));
	} else {
		// Deserialise the file to extract the tiddlers
		const tiddlers = this.commander.wiki.deserializeTiddlers(type || "text/html",body.toString("utf8"),{});
		$tw.utils.each(tiddlers,(tiddler) => {
			incomingWiki.addTiddler(new $tw.Tiddler(tiddler));
		});
	}
	// Filter the tiddlers to select the ones we want
	const filteredTitles = incomingWiki.filterTiddlers(options.importFilter || "[all[tiddlers]]");
	// Import the selected tiddlers
	let count = 0;
	incomingWiki.each((tiddler,title) => {
		if(filteredTitles.includes(title)) {
			let newTiddler;
			if(options.transformFilter) {
				const transformedTitle = (incomingWiki.filterTiddlers(options.transformFilter,null,self.commander.wiki.makeTiddlerIterator([title])) || [""])[0];
				if(transformedTitle) {
					self.commander.log(`Importing ${title} as ${transformedTitle}`);
					newTiddler = new $tw.Tiddler(tiddler,{title: transformedTitle});
				}
			} else {
				self.commander.log(`Importing ${title}`);
				newTiddler = tiddler;
			}
			self.commander.wiki.importTiddler(newTiddler);
			count++;
		}
	});
	self.commander.log(`Imported ${count} tiddlers`);
};

exports.Command = Command;
