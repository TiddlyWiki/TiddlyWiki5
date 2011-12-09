/*
Wikifier test rig

Usage:
	node wikitest.js <testdirectory>

This command creates a store and loads up all the `*.tid` files in the test directory. Then it wikifies each tiddler in turn,
verifying that the output matches `<tiddlername>.html` and `<tiddlername>.txt`.

*/


var Tiddler = require("./js/Tiddler.js").Tiddler,
	WikiStore = require("./js/WikiStore.js").WikiStore,
	tiddlerInput = require("./js/TiddlerInput"),
	utils = require("./js/Utils.js"),
	util = require("util"),
	fs = require("fs"),
	path = require("path");

var testdirectory = process.argv[2],
	store = new WikiStore(),
	files = fs.readdirSync(testdirectory),
	titles = [],
	f,t,extname,basename;

for(f=0; f<files.length; f++) {
	extname = path.extname(files[f]);
	if(extname === ".tid") {
		var tiddlers = tiddlerInput.parseTiddlerFile(fs.readFileSync(path.resolve(testdirectory,files[f]),"utf8"),extname);
		if(tiddlers.length > 1) {
			throw "Cannot use .JSON files";
		}
		store.addTiddler(new Tiddler(tiddlers[0]));
		titles.push(tiddlers[0].title);
	}
}

for(t=0; t<titles.length; t++) {
	var tree = store.getTiddler(titles[t]).getParseTree(),
		htmlRender = tree.render("text/html",store,titles[t]),
		htmlTarget = fs.readFileSync(path.resolve(testdirectory,titles[t] + ".html"),"utf8"),
		plainRender = tree.render("text/plain",store,titles[t]),
		plainTarget = fs.readFileSync(path.resolve(testdirectory,titles[t] + ".txt"),"utf8");
	if(htmlTarget !== htmlRender) {
		console.error("Tiddler %s html error\nTarget: %s\nFound: %s\n",titles[t],htmlTarget,htmlRender);
	}
	if(plainTarget !== plainRender) {
		console.error("Tiddler %s plain text error\nTarget: %s\nFound: %s\n",titles[t],plainTarget,plainRender);
	}
}
