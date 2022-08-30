/*\
module-type: utils
title: $:/core/modules/utils/simple-list.js
type: application/javascript

Switched from a linked list to simplify things

\*/
(function(){

function SimpleList() {
	this.clear();
};

Object.defineProperty(SimpleList.prototype,"length", {
	get: function() {
		return this.list.length;
	}
});

SimpleList.prototype.clear = function() {
	this.list = [];
};

SimpleList.prototype.remove = function(value) {
	if($tw.utils.isArray(value)) {
		for(var t=0; t<value.length; t++) {
			this._remove(value[t]);
		}
	} else {
		this._remove(value);
	}
};

/*
Push behaves like array.push and accepts multiple string arguments. But it also
accepts a single array argument too, to be consistent with its other methods.
*/
SimpleList.prototype.push = function(/* values */) {
	var values = arguments;
	if(arguments.length === 1 && $tw.utils.isArray(values[0])) {
		values = values[0];
	}
	for(var i = 0; i < values.length; i++) {
		this._push(values[i]);
	}
	return this.list.length;
};

SimpleList.prototype.pushTop = function(value) {
	// this.push(value);
	// -or-
	$tw.utils.pushTop(this.list,value);
};

SimpleList.prototype.each = function(callback) {
	$tw.utils.each(this.list,callback);
};

SimpleList.prototype.toArray = function() {
	return this.list.slice(0);
};

SimpleList.prototype.makeTiddlerIterator = function(wiki) {
	var self = this;
	return function(callback) {
		self.each(function(title) {
			callback(wiki.getTiddler(title),title);
		});
	};
};

SimpleList.prototype._remove = function(value) {
	var p = this.list.indexOf(value);
	if(p !== -1) {
		this.list.splice(p,1);
	}
};

SimpleList.prototype._push = function(value) {
	this.list.push(value);
};

exports.SimpleList = SimpleList;

})();
