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
			_removeOne(this,value[t]);
		}
	} else {
		_removeOne(this,value);
	}
};

LinkedList.prototype.push = function(/* values */) {
	for(var i = 0; i < arguments.length; i++) {
		var value = arguments[i];
		var node = {value: value};
		var preexistingNode = this.index[value];
		_linkToEnd(this,node);
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
			_removeOne(this,value[t]);
		}
		this.push.apply(this,value);
	} else {
		var node = _removeOne(this,value);
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
		_linkToEnd(this,node);
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

function _removeOne(list,value) {
	var node = list.index[value];
	if(node) {
		node.prev.next = node.next;
		node.next.prev = node.prev;
		list.length -= 1;
		// Point index to the next instance of the same value, maybe nothing.
		list.index[value] = node.copy;
	}
	return node;
};

function _linkToEnd(list,node) {
	// Sticks the given node onto the end of the list.
	list.prev.next = node;
	node.prev = list.prev;
	list.prev = node;
	node.next = list;
	list.length += 1;
};

exports.LinkedList = LinkedList;

})();
