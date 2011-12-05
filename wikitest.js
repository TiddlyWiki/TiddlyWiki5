/*
Wikifier test rig
*/


var Tiddler = require("./js/Tiddler.js").Tiddler,
	TiddlyWiki = require("./js/TiddlyWiki.js").TiddlyWiki,
	Formatter = require("./js/Formatter.js").Formatter,
	Wikifier = require("./js/Wikifier.js").Wikifier,
	utils = require("./js/Utils.js"),
	util = require("util");

// Create a store
var store = new TiddlyWiki();

// Create some tiddlers
store.addTiddler(new Tiddler({
	title: "First tiddler",
	text: "This is the ''text'' of the first tiddler"
}));
store.addTiddler(new Tiddler({
	title: "Second tiddler",
	text: "!!Heading\nThis is the text of the second tiddler. It has a list:\n* Item one\n* Item two\n* Item three\nAnd a <<macro invocation>>\n"
}));

// Create the formatter
var formatter = new Formatter();

// Create the wikifier attached to the store and the formatter
var wikifier = new Wikifier(store,formatter);

function wikifyTiddler(title) {
	wikifier.wikify(store.getTiddlerText(title));
	console.error(title + " wikified to:\n" + util.inspect(wikifier.tree,false,10));
}

wikifyTiddler("First tiddler");
wikifyTiddler("Second tiddler");
