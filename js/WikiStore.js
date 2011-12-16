/*\
title: js/WikiStore.js

\*/
(function(){

/*jslint node: true */
"use strict";

var Tiddler = require("./Tiddler.js").Tiddler,
	util = require("util");

var WikiStore = function WikiStore(options) {
	this.tiddlers = {};
	this.shadows = options.shadowStore !== undefined ? options.shadowStore : new WikiStore({
		shadowStore: null,
		textProcessors: options.textProcessors
	});
	this.textProcessors = options.textProcessors;
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
	var exists = this.tiddlers[title] instanceof Tiddler;
	if(exists) {
		return true;
	} else if (this.shadows) {
		return this.shadows.tiddlerExists(title);
	}
	return ;
};

WikiStore.prototype.addTiddler = function(tiddler) {
	this.tiddlers[tiddler.fields.title] = tiddler;
};

WikiStore.prototype.forEachTiddler = function(/* [sortField,[excludeTag,]]callback */) {
	var a = 0,
		sortField = arguments.length > 1 ? arguments[a++] : null,
		excludeTag = arguments.length > 2 ? arguments[a++] : null,
		callback = arguments[a++],
		t,tiddlers = [],tiddler;
	if(sortField) {
		for(t in this.tiddlers) {
			tiddlers.push(this.tiddlers[t]); 
		}
		tiddlers.sort(function (a,b) {
			var aa = a.fields[sortField] || 0,
				bb = b.fields[sortField] || 0;
			if(aa < bb) {
				return -1;
			} else {
				if(aa > bb) {
					return 1;
				} else {
					return 0;
				}
			}
		});
		for(t=0; t<tiddlers.length; t++) {
			if(!tiddlers[t].hasTag(excludeTag)) {
				callback.call(this,tiddlers[t].fields.title,tiddlers[t]);
			}
		}
	} else {
		for(t in this.tiddlers) {
			tiddler = this.tiddlers[t];
			if(tiddler instanceof Tiddler && !tiddler.hasTag(excludeTag))
				callback.call(this,t,tiddler);
		}
	}
};

WikiStore.prototype.getTitles = function(sortField,excludeTag) {
	var tiddlers = [];
	this.forEachTiddler(sortField,excludeTag,function(title,tiddler) {
		tiddlers.push(title);
	});
	return tiddlers;
};

WikiStore.prototype.parseTiddler = function(title) {
	var tiddler = this.getTiddler(title);
	if(tiddler) {
		return this.textProcessors.parse(tiddler.fields.type,tiddler.fields.text);
	} else {
		return null;
	}
};

/*
Render a tiddler to a particular MIME type. Optionally render it with a different tiddler as the context. This option is used to render a tiddler through a template as store.renderTiddler("text/html",tiddler,template)
*/
WikiStore.prototype.renderTiddler = function(type,title,asTitle) {
	var parser = this.parseTiddler(title),
		asTitleExists = asTitle ? this.tiddlerExists(asTitle) : true;
	if(parser && asTitleExists) {
		return parser.render(type,parser.children,this,asTitle ? asTitle : title);
	} else {
		return null;
	}
};

exports.WikiStore = WikiStore;

})();
