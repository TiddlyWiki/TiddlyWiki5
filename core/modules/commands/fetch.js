/*\
title: $:/core/modules/commands/fetch.js
type: application/javascript
module-type: command

Commands to fetch external tiddlers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "fetch",
	synchronous: false
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	if(this.params.length < 2) {
		return "Missing subcommand and url";
	}
	var subcommand = this.params[0],
		url = this.params[1],
		importFilter = this.params[2] || "[all[tiddlers]]",
		transformFilter = this.params[3] || "";
	switch(subcommand) {
		case "file":
			return this.fetchFiles({
				url: url,
				importFilter: importFilter,
				transformFilter: transformFilter,
				callback: this.callback
			});
			break;
		case "files":
			return this.fetchFiles({
				urlFilter: url,
				importFilter: importFilter,
				transformFilter: transformFilter,
				callback: this.callback
			});
			break;
	}
	return null;
};

Command.prototype.fetchFiles = function(options) {
	var self = this;
	// Get the list of URLs
	var urls;
	if(options.url) {
		urls = [options.url]
	} else if(options.urlFilter) {
		urls = $tw.wiki.filterTiddlers(options.urlFilter);
	} else {
		return "Missing URL";
	}
	// Process each URL in turn
	var next = 0;
	var getNextFile = function(err) {
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

Command.prototype.fetchFile = function(url,options,callback) {
	var self = this,
		lib = url.substr(0,8) === "https://" ? require("https") : require("http");
	lib.get(url).on("response",function(response) {
	    var type = (response.headers["content-type"] || "").split(";")[0],
	    	body = "";
	    self.commander.write("Reading " + url + ": ");
	    response.on("data",function(chunk) {
	        body += chunk;
	        self.commander.write(".");
	    });
	    response.on("end",function() {
	        self.commander.write("\n");
	        if(response.statusCode === 200) {
		        self.processBody(body,type,options);
		        callback(null);
	        } else {
	        	callback("Error " + response.statusCode + " retrieving " + url)
	        }
	   	});
	   	response.on("error",function(e) {
			console.log("Error on GET request: " + e);
			callback(e);
	   	});
	});
	return null;
};

Command.prototype.processBody = function(body,type,options) {
	// Deserialise the HTML file and put the tiddlers in their own wiki
	var self = this,
		incomingWiki = new $tw.Wiki(),
		tiddlers = this.commander.wiki.deserializeTiddlers(type || "text/html",body,{});
	$tw.utils.each(tiddlers,function(tiddler) {
		incomingWiki.addTiddler(new $tw.Tiddler(tiddler));
	});
	// Filter the tiddlers to select the ones we want
	var filteredTitles = incomingWiki.filterTiddlers(options.importFilter);
	// Import the selected tiddlers
	var count = 0;
	incomingWiki.each(function(tiddler,title) {
		if(filteredTitles.indexOf(title) !== -1) {
			var newTiddler;
			if(options.transformFilter) {
				var transformedTitle = (incomingWiki.filterTiddlers(options.transformFilter,null,self.commander.wiki.makeTiddlerIterator([title])) || [""])[0];
				if(transformedTitle) {
					self.commander.log("Importing " + title + " as " + transformedTitle)
					newTiddler = new $tw.Tiddler(tiddler,{title: transformedTitle});
				}
			} else {
				self.commander.log("Importing " + title)
				newTiddler = tiddler;
			}
			self.commander.wiki.importTiddler(newTiddler);
			count++;
		}
	});
	self.commander.log("Imported " + count + " tiddlers")
};

exports.Command = Command;

})();
