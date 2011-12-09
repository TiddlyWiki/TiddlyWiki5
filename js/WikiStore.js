/*jslint node: true */
"use strict";

var Tiddler = require("./Tiddler.js").Tiddler,
	util = require("util");

var WikiStore = function WikiStore(shadowStore) {
	this.tiddlers = {};
	this.shadows = shadowStore === undefined ? new WikiStore(null) : shadowStore;
};

WikiStore.prototype.clear = function() {
	this.tiddlers = {};
};

WikiStore.prototype.getTiddler = function(title) {
	var t = this.tiddlers[title];
	if(t instanceof Tiddler) {
		return t;
	} else if(this.shadows) {
		return this.shadows.getTiddler(title);
	} else {
		return null;
	}
};

WikiStore.prototype.getTiddlerText = function(title) {
	var t = this.getTiddler(title);
	return t instanceof Tiddler ? t.fields.text : null;
};

WikiStore.prototype.deleteTiddler = function(title) {
	delete this.tiddlers[title];
};

WikiStore.prototype.tiddlerExists = function(title) {
	return this.tiddlers[title] instanceof Tiddler;
};

WikiStore.prototype.addTiddler = function(tiddler) {
	this.tiddlers[tiddler.fields.title] = tiddler;
};

WikiStore.prototype.forEachTiddler = function(callback) {
	var t;
	for(t in this.tiddlers) {
		var tiddler = this.tiddlers[t];
		if(tiddler instanceof Tiddler)
			callback.call(this,t,tiddler);
	}
};

exports.WikiStore = WikiStore;
