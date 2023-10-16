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
	// LinkedList performs the duty of both the head and tail node
	this.next = new LLMap();
	this.prev = new LLMap();
	// Linked list head initially points to itself
	this.next.set(null, null);
	this.prev.set(null, null);
	this.length = 0;
};

LinkedList.prototype.remove = function(value) {
	if($tw.utils.isArray(value)) {
		for(var t=0; t<value.length; t++) {
			_assertString(value[t]);
		}
		for(var t=0; t<value.length; t++) {
			_removeOne(this,value[t]);
		}
	} else {
		_assertString(value);
		_removeOne(this,value);
	}
};

/*
Push behaves like array.push and accepts multiple string arguments. But it also
accepts a single array argument too, to be consistent with its other methods.
*/
LinkedList.prototype.push = function(/* values */) {
	var i, values = arguments;
	if($tw.utils.isArray(values[0])) {
		values = values[0];
	}
	for(i = 0; i < values.length; i++) {
		_assertString(values[i]);
	}
	for(i = 0; i < values.length; i++) {
		_linkToEnd(this,values[i]);
	}
	return this.length;
};

LinkedList.prototype.pushTop = function(value) {
	var t;
	if($tw.utils.isArray(value)) {
		for (t=0; t<value.length; t++) {
			_assertString(value[t]);
		}
		for(t=0; t<value.length; t++) {
			_removeOne(this,value[t]);
		}
		for(t=0; t<value.length; t++) {
			_linkToEnd(this,value[t]);
		}
	} else {
		_assertString(value);
		_removeOne(this,value);
		_linkToEnd(this,value);
	}
};

LinkedList.prototype.each = function(callback) {
	var visits = Object.create(null),
		value = this.next.get(null);
	while(value !== null) {
		callback(value);
		var next = this.next.get(value);
		if(Array.isArray(next)) {
			var i = visits[value] || 0;
			visits[value] = i+1;
			value = next[i];
		} else {
			value = next;
		}
	}
};

LinkedList.prototype.toArray = function() {
	var output = new Array(this.length),
		index = 0;
	this.each(function(value) { output[index++] = value; });
	return output;
};

LinkedList.prototype.makeTiddlerIterator = function(wiki) {
	var self = this;
	return function(callback) {
		self.each(function(title) {
			callback(wiki.getTiddler(title),title);
		});
	};
};

function _removeOne(list,value) {
	var nextEntry = list.next.get(value);
	if(nextEntry === undefined) {
		return;
	}
	var prevEntry = list.prev.get(value),
		prev = prevEntry,
		next = nextEntry,
		ref;
	if(Array.isArray(nextEntry)) {
		next = nextEntry[0];
		prev = prevEntry[0];
	}
	// Relink preceding element.
	ref = list.next.get(prev);
	if(Array.isArray(ref)) {
		var i = ref.indexOf(value);
		ref[i] = next;
	} else {
		list.next.set(prev,next);
	}

	// Now relink following element
	ref = list.prev.get(next);
	if(Array.isArray(ref)) {
		var i = ref.indexOf(value);
		ref[i] = prev;
	} else {
		list.prev.set(next,prev);
	}

	// Delink actual value. If it uses arrays, just remove first entries.
	if(Array.isArray(nextEntry) && nextEntry.length > 1) {
		nextEntry.shift();
		prevEntry.shift();
	} else {
		list.next.set(value,undefined);
		list.prev.set(value,undefined);
	}
	list.length -= 1;
};

// Sticks the given node onto the end of the list.
function _linkToEnd(list,value) {
	var old = list.next.get(value);
	var last = list.prev.get(null);
	// Does it already exists?
	if(old !== undefined) {
		if(!Array.isArray(old)) {
			old = [old];
			list.next.set(value,old);
			list.prev.set(value,[list.prev.get(value)]);
		}
		old.push(null);
		list.prev.get(value).push(last);
	} else {
		list.next.set(value,null);
		list.prev.set(value,last);
	}
	// Make the old last point to this new one.
	if(value !== last) {
		var array = list.next.get(last);
		if(Array.isArray(array)) {
			array[array.length-1] = value;
		} else {
			list.next.set(last,value);
		}
		list.prev.set(null,value);
	} else {
		// Edge case, the pushed value was already the last value.
		// The second-to-last nextPtr for that value must point to itself now.
		var array = list.next.get(last);
		array[array.length-2] = value;
	}
	list.length += 1;
};

function _assertString(value) {
	if(typeof value !== "string") {
		throw "Linked List only accepts string values, not " + value;
	}
};

var LLMap = function() {
	this.map = Object.create(null);
};

// Just a wrapper so our object map can also accept null.
LLMap.prototype = {
	set: function(key,val) {
		(key === null) ? (this.null = val) : (this.map[key] = val);
	},
	get: function(key) {
		return (key === null) ? this.null : this.map[key];
	}
};

exports.LinkedList = LinkedList;

})();
