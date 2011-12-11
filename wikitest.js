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
	WikiTextRenderer = require("./js/WikiTextRenderer.js").WikiTextRenderer,
	TiddlerConverters = require("./js/TiddlerConverters.js").TiddlerConverters,
	tiddlerInput = require("./js/TiddlerInput.js"),
	utils = require("./js/Utils.js"),
	util = require("util"),
	fs = require("fs"),
	path = require("path");

var testdirectory = process.argv[2],
	tiddlerConverters = new TiddlerConverters(),
	store = new WikiStore(),
	files = fs.readdirSync(testdirectory),
	titles = [],
	f,t,extname,basename;

tiddlerInput.register(tiddlerConverters);

for(f=0; f<files.length; f++) {
	extname = path.extname(files[f]);
	if(extname === ".tid") {
		var tiddlers = tiddlerConverters.deserialize(extname,fs.readFileSync(path.resolve(testdirectory,files[f]),"utf8"));
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
		parser = store.getTiddler(titles[t]).getParseTree(),
		renderer = new WikiTextRenderer(parser,store,titles[t]),
		htmlRender = renderer.render("text/html"),
		plainRender = renderer.render("text/plain");
	if(htmlTarget !== htmlRender) {
		console.error("Tiddler %s html error\nTarget: %s\nFound: %s\n",titles[t],htmlTarget,htmlRender);
	}
	if(plainTarget !== plainRender) {
		console.error("Tiddler %s plain text error\nTarget: %s\nFound: %s\n",titles[t],plainTarget,plainRender);
	}
}
