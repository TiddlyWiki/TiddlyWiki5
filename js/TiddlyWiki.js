/*global require: false, exports: false */
"use strict";

var Tiddler = require("./Tiddler.js").Tiddler;

var TiddlyWiki = function() {
	this.tiddlers = {};
};

TiddlyWiki.prototype.clear = function() {
	this.tiddlers = {};
};

TiddlyWiki.prototype.getTiddler = function(title) {
	var t = this.tiddlers[title];
	return t instanceof Tiddler ? t : null;
};

TiddlyWiki.prototype.getTiddlerText = function(title) {
	var t = this.tiddlers[title];
	return t instanceof Tiddler ? t.fields.text : null;
};

TiddlyWiki.prototype.deleteTiddler = function(title) {
	delete this.tiddlers[title];
};

TiddlyWiki.prototype.isTiddler = function(title) {
	return this.tiddlers[title] instanceof Tiddler;
};

TiddlyWiki.prototype.addTiddler = function(tiddler) {
	this.tiddlers[tiddler.fields.title] = tiddler;
};

TiddlyWiki.prototype.forEachTiddler = function(callback) {
	var t;
	for(t in this.tiddlers) {
		var tiddler = this.tiddlers[t];
		if(tiddler instanceof Tiddler)
			callback.call(this,t,tiddler);
	}
};

exports.TiddlyWiki = TiddlyWiki;
