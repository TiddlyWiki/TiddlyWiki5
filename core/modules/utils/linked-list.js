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
	this.next = Object.create(null);
	this.prev = Object.create(null);
	this.first = undefined;
	this.last = undefined;
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

LinkedList.prototype.push = function(/* values */) {
	for(var i = 0; i < arguments.length; i++) {
		_assertString(arguments[i]);
	}
	for(var i = 0; i < arguments.length; i++) {
		_linkToEnd(this,arguments[i]);
	}
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
		value = this.first;
	while (value !== undefined) {
		callback(value);
		var next = this.next[value];
		if (typeof next === "object") {
			var i = visits[value] || 0;
			visits[value] = i+1;
			value = next[i];
		} else {
			value = next;
		}
	}
};

LinkedList.prototype.toArray = function() {
	var output = [];
	this.each(function(value) { output.push(value); });
	return output;
};

function _removeOne(list,value) {
	var prev = list.prev[value],
		next = list.next[value],
		oldPrev = prev,
		newNext = next;
	if (typeof next === 'object') {
		newNext = next[0];
		oldPrev = prev[0];
	}
	if (list.first === value) {
		list.first = newNext
	} else if (oldPrev) {
		if (typeof list.next[oldPrev] === 'object') {
			var i = list.next[oldPrev].indexOf(value);
			list.next[oldPrev][i] = newNext;
		} else {
			list.next[oldPrev] = newNext;
		}
	} else {
		return;
	}
	if (next !== undefined) {
		if (typeof list.prev[newNext] === 'object') {
			var i = list.prev[newNext].indexOf(value);
			list.prev[newNext][i] = oldPrev;
		} else {
			list.prev[newNext] = oldPrev;
		}
	} else {
		list.last = prev;
	}
	// We either remove value, or if there were multiples, set the next value
	// up as the first.
	if (typeof next === 'object' && (list.next[value].length >= 1 || list.prev[value].length > 1)) {
		list.next[value].shift();
		list.prev[value].shift();
	} else {
		delete list.next[value];
		delete list.prev[value];
	}
	list.length -= 1;
};

// Sticks the given node onto the end of the list.
function _linkToEnd(list,value) {
	if (list.first === undefined) {
		list.first = value;
	} else {
		// Does it already exists?
		if (list.first === value || list.prev[value]) {
			if (typeof list.next[value] === 'string') {
				list.next[value] = [list.next[value]];
				list.prev[value] = [list.prev[value]];
			} else if (typeof list.next[value] === 'undefined') {
				// special case. The list already contains exacly 1 "value".
				list.next[value] = [];
				list.prev[value] = [list.prev[value]];
			}
			list.prev[value].push(list.last);
			// We do NOT append a new value onto this list. It is implied
			// given that we'll now reference this value more times than this
			// has references to something else.
			// It's new "next" points to nothing
		} else {
			list.prev[value] = list.last;
		}
		// Make the old last point to this new one.
		if (typeof list.next[list.last] === 'object') {
			list.next[list.last].push(value);
		} else {
			list.next[list.last] = value;
		}
	}
	list.last = value;
	list.length += 1;
};

function _assertString(value) {
	if (typeof value !== 'string') {
		throw "Linked List only accepts string values, not " + value;
	}
};

exports.LinkedList = LinkedList;

})();
