/*\
module-type: utils
title: $:/core/modules/utils/linkedlist.js
type: application/javascript

\*/

exports.LinkedList = function() {
	this.clear();
};

var Lp = exports.LinkedList.prototype;

Lp.clear = function() {
	this.index = Object.create(null);
	this.next = this;
	this.prev = this;
	this.length = 0;
};

Lp.remove = function(value) {
	if ($tw.utils.isArray(value)) {
		for (var t=0; t<value.length; t++) {
			this._removeOne(value[t]);
		}
	} else {
		this._removeOne(value);
	}
};

Lp._removeOne = function(value) {
	var node = this.index[value];
	if (node) {
		node.prev.next = node.next;
		node.next.prev = node.prev;
		this.length -= 1;
		// Point the index to the next copy of the value, maybe nothing.
		this.index[value] = node.copy;
	}
	return node;
};

Lp._linkToEnd = function(node) {
	this.prev.next = node;
	node.prev = this.prev;
	this.prev = node;
	node.next = this;
	this.length += 1;
};

Lp.push = function(/* values */) {
	for (var i = 0; i < arguments.length; i++) {
		var value = arguments[i];
		var node = {value: value};
		var preexistingNode = this.index[value];
		this._linkToEnd(node);
		if (preexistingNode) {
			// We want to keep pointing to the first instance, but we want
			// to have that instance (or chain of instances) point to the
			// new one.
			while (preexistingNode.copy) {
				preexistingNode = preexistingNode.copy;
			}
			preexistingNode.copy = node;
		} else {
			this.index[value] = node;
		}
	}
};

Lp.pushTop = function(value) {
	if ($tw.utils.isArray(value)) {
		for (var t=0; t<value.length; t++) {
			this._removeOne(value[t]);
		}
		this.push.apply(this, value);
	} else {
		var node = this._removeOne(value);
		if (!node) {
			node = {value: value};
			this.index[value] = node;
		}
		this._linkToEnd(node);
	}
};

Lp.each = function(callback) {
	var ptr = this.next;
	while (ptr !== this) {
		callback(ptr.value);
		ptr = ptr.next;
	}
};

Lp.toArray = function() {
	var output = [];
	for (var ptr = this.next; ptr !== this; ptr = ptr.next) {
		output.push(ptr.value);
	}
	return output;
};
