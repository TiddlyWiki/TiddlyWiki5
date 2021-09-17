/*\
module-type: utils
title: $:/core/modules/utils/iterator.js
type: application/javascript

This iterator can be used for lazy evaluation. It's designed to be forward
compatible with ECMA 2015's yield statements and generator functions.

Objects returned by next() are {value: value, done: false}, but the next method
returned by this need only return a string or null.

If we decide not to be forward-compatible with for..of and yield, then we
can scrap this and just pass around iterator methods instead.
\*/

function Iterator(next) {
	this.method = next;
};

Iterator.prototype.next = function() {
	var value = this.method();
	if (value !== undefined) {
		return { value: value, done: false };
	} else {
		return { done: true };
	}
};

Iterator.prototype.return = function(value) {
	this.method = function() { return undefined; };
	return { value: value, done: true };
};

Iterator.prototype.throw = function(exception) { throw exception; };

// This provides compatibility with yield and for...of
if ((typeof(Symbol) !== "undefined") && Symbol.iterator) {
	Iterator.prototype[Symbol.iterator] = function() { return this; };
}

exports.Iterator = Iterator;
