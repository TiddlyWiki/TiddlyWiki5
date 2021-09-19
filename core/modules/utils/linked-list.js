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
	this.next = new OurMap();
	this.prev = new OurMap();
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
	var values = arguments;
	if($tw.utils.isArray(values[0])) {
		values = values[0];
	}
	for(var i = 0; i < values.length; i++) {
		_assertString(values[i]);
	}
	for(var i = 0; i < values.length; i++) {
		_linkToEnd(this,values[i]);
	}
	return this.length;
};

LinkedList.prototype.pushTop = function(value) {
	if($tw.utils.isArray(value)) {
		for (var t=0; t<value.length; t++) {
			_assertString(value[t]);
		}
		for(var t=0; t<value.length; t++) {
			_removeOne(this,value[t]);
		}
		for(var t=0; t<value.length; t++) {
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
		value = this.next.get();
	while(value !== undefined) {
		callback(value);
		var next = this.next.get(value);
		if(typeof next === "object") {
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
	if(!list.next.has(value)) {
		return;
	}
	var prevEntry = list.prev.get(value),
		nextEntry = list.next.get(value),
		prev = prevEntry,
		next = nextEntry,
		ref;
	if(typeof nextEntry === "object") {
		next = nextEntry[0];
		prev = prevEntry[0];
	}
	// Relink preceding element.
	ref = list.next.get(prev);
	if(typeof ref === "object") {
		var i = ref.indexOf(value);
		ref[i] = next;
	} else {
		list.next.set(prev,next);
	}

	// Now relink following element
	// Check "next !== undefined" rather than "list.last === value" because
	// we need to know if the FIRST value is the last in the list, not the last.
	ref = list.prev.get(next);
	if(typeof ref === "object") {
		var i = ref.indexOf(value);
		ref[i] = prev;
	} else {
		list.prev.set(next,prev);
	}

	// Delink actual value. If it uses arrays, just remove first entries.
	if(typeof nextEntry === "object" && nextEntry.length > 1) {
		nextEntry.shift();
		prevEntry.shift();
	} else {
		list.next.delete(value);
		list.prev.delete(value);
	}
	list.length -= 1;
};

// Sticks the given node onto the end of the list.
function _linkToEnd(list,value) {
	var old;
	var last = list.prev.get();
	// Does it already exists?
	if(list.next.has(value)) {
		old = list.next.get(value);
		if(typeof old !== "object") {
			old = [old];
			list.next.set(value,old);
			list.prev.set(value,[list.prev.get(value)]);
		}
		old.push(undefined);
		list.prev.get(value).push(last);
	} else {
		list.next.set(value,undefined);
		list.prev.set(value,last);
	}
	// Make the old last point to this new one.
	if (value !== last) {
		var array = list.next.get(last);
		if(typeof array === "object") {
			array[array.length-1] = value;
		} else {
			list.next.set(last,value);
		}
		list.prev.set(undefined,value);
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

var OurMap;

if (typeof Map === "function") {
	OurMap = Map;
} else {
	// Create a simple backup map for IE and such which handles undefined.
	OurMap = function() {
		this.map = Object.create(null);
	};

	OurMap.prototype = {
		set: function(key,val) {
			(key === undefined) ? (this.undef = val) : (this.map[key] = val);
		},
		get: function(key) {
			return (key === undefined) ? this.undef : this.map[key];
		},
		delete: function(key) {
			delete this.map[key];
		},
		has: function(key) {
			return $tw.utils.hop(this.map, key);
		}
	};
}

exports.LinkedList = LinkedList;

})();
