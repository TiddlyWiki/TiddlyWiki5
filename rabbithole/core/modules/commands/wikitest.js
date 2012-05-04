/*\
title: $:/core/modules/commands/wikitest.js
type: application/javascript
module-type: command

wikitest command

\*/
(function(){

/*jslint node: true, browser: true */
"use strict";

exports.info = {
	name: "wikitest",
	synchronous: true
};

var Command = function(params,commander) {
	this.params = params;
	this.commander = commander;
};

Command.prototype.execute = function() {
	if(this.params.length <1) {
		return "Missing parameters";
	}
	var fs = require("fs"),
		path = require("path"),
		testdirectory = this.params[0],
		saveResults = this.params[1] === "save",
		files = fs.readdirSync(testdirectory),
		titles = [],
		f,t,extname,basename;
	for(f=0; f<files.length; f++) {
		extname = path.extname(files[f]);
		if(extname === ".tid") {
			var tiddlers = this.commander.wiki.deserializeTiddlers(extname,fs.readFileSync(path.resolve(testdirectory,files[f]),"utf8"));
			if(tiddlers.length > 1) {
				throw "Cannot use .JSON files";
			}
			this.commander.wiki.addTiddler(new $tw.Tiddler(tiddlers[0]));
			titles.push(tiddlers[0].title);
		}
	}
	for(t=0; t<titles.length; t++) {
		var htmlFilename = path.resolve(testdirectory,titles[t] + ".html"),
			plainFilename = path.resolve(testdirectory,titles[t] + ".txt"),
			htmlTarget = fs.readFileSync(htmlFilename,"utf8"),
			plainTarget = fs.readFileSync(plainFilename,"utf8"),
			tiddler = this.commander.wiki.getTiddler(titles[t]),
			htmlRender = this.commander.wiki.renderTiddler("text/html",titles[t]),
			plainRender = this.commander.wiki.renderTiddler("text/plain",titles[t]);
		if(saveResults) {
			// Save results
			fs.writeFileSync(htmlFilename,htmlRender,"utf8");
			fs.writeFileSync(plainFilename,plainRender,"utf8");
		} else {
			// Report results
			if(htmlTarget !== htmlRender) {
				this.commander.streams.output.write("Tiddler " + titles[t] + " html error\nTarget: " + htmlTarget + "\nFound:  " + htmlRender +"\n");
			}
			if(plainTarget !== plainRender) {
				this.commander.streams.output.write("Tiddler " + titles[t] + " plain text error\nTarget: " + plainTarget + "\nFound:  " + plainRender + "\n");
			}
		}
	}
	return null; // No error
};

exports.Command = Command;

})();
