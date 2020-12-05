/*\
module-type: utils
title: $:/core/modules/utils/linkedlist.js
type: application/javascript

This is a doubly-linked indexed list intended for manipulation, particularly
pushTop, which it does with significantly better performance than an array.

\*/
(function(){

function LinkedList() {
	this.clear();
};

LinkedList.prototype.clear = function() {
	this.index = Object.create(null);
	// LinkedList performs the duty of both the head and tail node
	this.next = this;
	this.prev = this;
	this.length = 0;
};

LinkedList.prototype.remove = function(value) {
	if($tw.utils.isArray(value)) {
		for(var t=0; t<value.length; t++) {
			this._removeOne(value[t]);
		}
	} else {
		this._removeOne(value);
	}
};

LinkedList.prototype._removeOne = function(value) {
	var node = this.index[value];
	if(node) {
		node.prev.next = node.next;
		node.next.prev = node.prev;
		this.length -= 1;
		// Point index to the next instance of the same value, maybe nothing.
		this.index[value] = node.copy;
	}
	return node;
};

LinkedList.prototype._linkToEnd = function(node) {
	// Sticks the given node onto the end of the list.
	this.prev.next = node;
	node.prev = this.prev;
	this.prev = node;
	node.next = this;
	this.length += 1;
};

LinkedList.prototype.push = function(/* values */) {
	for(var i = 0; i < arguments.length; i++) {
		var value = arguments[i];
		var node = {value: value};
		var preexistingNode = this.index[value];
		this._linkToEnd(node);
		if(preexistingNode) {
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

LinkedList.prototype.pushTop = function(value) {
	if($tw.utils.isArray(value)) {
		for(var t=0; t<value.length; t++) {
			this._removeOne(value[t]);
		}
		this.push.apply(this, value);
	} else {
		var node = this._removeOne(value);
		if(!node) {
			node = {value: value};
			this.index[value] = node;
		} else {
			// Put this node at the end of the copy chain.
			var preexistingNode = node;
			while(preexistingNode.copy) {
				preexistingNode = preexistingNode.copy;
			}
			// The order of these three statements is important,
			// because sometimes preexistingNode == node.
			preexistingNode.copy = node;
			this.index[value] = node.copy;
			node.copy = undefined;
		}
		this._linkToEnd(node);
	}
};

LinkedList.prototype.each = function(callback) {
	for(var ptr = this.next; ptr !== this; ptr = ptr.next) {
		callback(ptr.value);
	}
};

LinkedList.prototype.toArray = function() {
	var output = [];
	for(var ptr = this.next; ptr !== this; ptr = ptr.next) {
		output.push(ptr.value);
	}
	return output;
};

exports.LinkedList = LinkedList;

})();
