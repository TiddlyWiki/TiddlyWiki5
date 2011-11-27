var Tiddler = require("./Tiddler.js").Tiddler;

var TiddlyWiki = function() {
	this.tiddlers = {};
};

TiddlyWiki.prototype.clear = function() {
	this.tiddlers = {};
}

TiddlyWiki.prototype.fetchTiddler = function(title) {
	var t = this.tiddlers[title];
	return t instanceof Tiddler ? t : null;
}

TiddlyWiki.prototype.deleteTiddler = function(title) {
	delete this.tiddlers[title];
}

TiddlyWiki.prototype.addTiddler = function(tiddler) {
	this.tiddlers[tiddler.title] = tiddler;
}

TiddlyWiki.prototype.forEachTiddler = function(callback) {
	var t;
	for(t in this.tiddlers) {
		var tiddler = this.tiddlers[t];
		if(tiddler instanceof Tiddler)
			callback.call(this,t,tiddler);
	}
}

exports.TiddlyWiki = TiddlyWiki
