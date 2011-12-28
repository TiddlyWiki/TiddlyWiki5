(function(){

/*
Wikifier test rig

Usage:
	node wikitest.js <testdirectory>

This command creates a store and loads up all the `*.tid` files in the test directory. Then it wikifies each tiddler in turn,
verifying that the output matches `<tiddlername>.html` and `<tiddlername>.txt`.

*/

/*jslint node: true */
"use strict";

var Tiddler = require("./js/Tiddler.js").Tiddler,
	WikiStore = require("./js/WikiStore.js").WikiStore,
	WikiTextProcessor = require("./js/WikiTextProcessor.js").WikiTextProcessor,
	tiddlerInput = require("./js/TiddlerInput.js"),
	utils = require("./js/Utils.js"),
	util = require("util"),
	fs = require("fs"),
	path = require("path");

var testdirectory = process.argv[2],
	store = new WikiStore(),
	files = fs.readdirSync(testdirectory),
	titles = [],
	f,t,extname,basename;

store.registerTextProcessor("text/x-tiddlywiki",new WikiTextProcessor({
	store: store
}));
tiddlerInput.register(store);

// Frightful temporary hack, but setup the sandbox for evaluated macro parameters
var Sandbox = require("./js/Sandbox.js").Sandbox;
store.sandbox = new Sandbox(fs.readFileSync("parsers/javascript.pegjs","utf8"));

for(f=0; f<files.length; f++) {
	extname = path.extname(files[f]);
	if(extname === ".tid") {
		var tiddlers = store.deserializeTiddlers(extname,fs.readFileSync(path.resolve(testdirectory,files[f]),"utf8"));
		if(tiddlers.length > 1) {
			throw "Cannot use .JSON files";
		}
		store.addTiddler(new Tiddler(tiddlers[0]));
		titles.push(tiddlers[0].title);
	}
}

for(t=0; t<titles.length; t++) {
	var htmlTarget = fs.readFileSync(path.resolve(testdirectory,titles[t] + ".html"),"utf8"),
		plainTarget = fs.readFileSync(path.resolve(testdirectory,titles[t] + ".txt"),"utf8"),
		tiddler = store.getTiddler(titles[t]),
		htmlRender = store.renderTiddler("text/html",titles[t]),
		plainRender = store.renderTiddler("text/plain",titles[t]);
	if(htmlTarget !== htmlRender) {
		console.error("Tiddler %s html error\nTarget: %s\nFound:  %s\n",titles[t],htmlTarget,htmlRender);
	}
	if(plainTarget !== plainRender) {
		console.error("Tiddler %s plain text error\nTarget: %s\nFound:  %s\n",titles[t],plainTarget,plainRender);
	}
}

})();
