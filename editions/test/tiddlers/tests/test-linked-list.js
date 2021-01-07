/*\
title: test-linked-list.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the utils.LinkedList class.

LinkedList was built to behave exactly as $tw.utils.pushTop and
Array.prototype.push would behave with an array.

Many of these tests function by performing operations on a paired set of
an array and LinkedList. It uses equivalent actions on both.
Then we confirm that the two come out functionally identical.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

describe("LinkedList class tests", function() {

	// creates and initializes a new {array, list} pair for testing
	function newPair(initialArray) {
		var pair = {array: [], list: new $tw.utils.LinkedList()};
		if (initialArray) {
			push(pair, initialArray);
		}
		return pair;
	};

	// pushTops a value or array of values into both the array and linked list.
	function pushTop(pair, valueOrValues) {
		pair.list.pushTop(valueOrValues);
		$tw.utils.pushTop(pair.array, valueOrValues);
	};

	// pushes values into both the array and the linked list.
	function push(pair, values) {
		pair.list.push.apply(pair.list, values);
		pair.array.push.apply(pair.array, values);
	};

	// operates a remove action on an array and a linked list in parallel.
	function remove(pair, valueOrValues) {
		pair.list.remove(valueOrValues);
		$tw.utils.removeArrayEntries(pair.array, valueOrValues);
	};

	// compares an array and a linked list to make sure they match up
	function compare(pair) {
		expect(pair.list.toArray()).toEqual(pair.array);
		expect(pair.list.length).toBe(pair.array.length);
	};

	it("can pushTop", function() {
		var pair = newPair(['A', 'B', 'C']);
		// singles
		pushTop(pair, 'X');
		pushTop(pair, 'B');
		compare(pair); // A C X B
		//arrays
		pushTop(pair, ['X', 'A', 'G', 'A']);
		// If the pushedTopped list has duplicates, they go in unempeded.
		compare(pair); // C B X A G A
	});

	it("can pushTop with tricky duplicates", function() {
		var pair = newPair(['A', 'B', 'A', 'C', 'A', 'end']);
		// If the original list contains duplicates, only one instance is cut
		pushTop(pair, 'A');
		compare(pair); // B A C A end A

		// And the Llist properly knows the next 'A' to cut if pushed again
		pushTop(pair, ['X', 'A']);
		compare(pair); // B C A end A X A

		// One last time, to make sure we maintain the linked chain of copies
		pushTop(pair, 'A');
		compare(pair); // B C end A X A A
	});

	it("can pushTop a single-value list with itself", function() {
		var pair = newPair(['A']);
		pushTop(pair, 'A');
		compare(pair); // A
	});

	it("can remove all instances of a multi-instance value", function() {
		var pair = newPair(['A', 'A']);
		remove(pair, ['A', 'A']);
		compare(pair); //

		// Again, but this time with other values mixed in
		pair = newPair(['B', 'A', 'A', 'C']);
		remove(pair, ['A', 'A']);
		compare(pair); // B C

		// And again, but this time with value inbetween too.
		pair = newPair(['B', 'A', 'X', 'Y', 'Z', 'A', 'C']);
		remove(pair, ['A', 'A']);
		compare(pair); // B X Y Z C
	});

	it("can pushTop value linked to by a repeat item", function() {
		var pair = newPair(['A', 'B', 'A', 'C', 'A', 'C', 'D']);
		// This is tricky because that 'C' is referenced by a second 'A'
		// It WAS a crash before
		pushTop(pair, 'C');
		compare(pair); // A B A A C D C
	});

	it("can handle particularly nasty pushTop pitfall", function() {
		var pair = newPair(['A', 'B', 'A', 'C']);
		pushTop(pair, 'A'); // BACA
		pushTop(pair, 'X'); // BACAX
		remove(pair, 'A');  // BCAX
		pushTop(pair, 'A'); // BCXA
		remove(pair, 'A');  // BCX

		// But! The way I initially coded the copy chains, a mystery A could
		// hang around.
		compare(pair); // B C X
	});

	it('can handle past-duplicate items when pushing', function() {
		var pair = newPair(['X', 'Y', 'A', 'C', 'A']);
		// Removing an item, when it has a duplicat at the list's end
		remove(pair, 'A');
		compare(pair); // XYCA
		// This actually caused an infinite loop once. So important test here.
		push(pair, ['A']);
		compare(pair); // XYCAA
	});

	it("can push", function() {
		var pair = newPair(['A', 'B', 'C']);
		// singles
		push(pair, ['B']);
		compare(pair); // A B C B

		// multiple args
		push(pair, ['A', 'B', 'C']);
		compare(pair); // A B C B A B C
	});

	it('can handle empty string', function() {
		var pair = newPair(['', '', '']);
		compare(pair); // '' '' ''

		pushTop(pair, ['A', '']);
		compare(pair); // '' '' A ''
	});

	it('will throw if told to push non-strings', function() {
		var message = "Linked List only accepts string values, not ";
		var list = new $tw.utils.LinkedList();
		expect(() => list.push(undefined)).toThrow(message + "undefined");
		expect(() => list.pushTop(undefined)).toThrow(message + "undefined");
		expect(() => list.pushTop(['c', undefined])).toThrow(message + "undefined");
		expect(() => list.pushTop(5)).toThrow(message + "5");
		expect(() => list.pushTop(null)).toThrow(message + "null");

		// now lets do a quick test to make sure this exception
		// doesn't leave any side-effects
		// A.K.A Strong guarantee
		var pair = newPair(['A', '5', 'B', 'C']);
		expect(() => pushTop(pair, 5)).toThrow(message + "5");
		compare(pair);
		expect(() => push(pair, ['D', 7])).toThrow(message + "7");
		compare(pair);
		expect(() => remove(pair, 5)).toThrow(message + "5");
		compare(pair);
		// This is the tricky one. 'A' and 'B' should not be removed or pushed.
		expect(() => pushTop(pair, ['A', 'B', null])).toThrow(message + "null");
		compare(pair);
		expect(() => remove(pair, ['A', 'B', null])).toThrow(message + "null");
		compare(pair);
	});

	it("can clear", function() {
		var list = new $tw.utils.LinkedList();
		list.push('A', 'B', 'C');
		list.clear();
		expect(list.toArray()).toEqual([]);
		expect(list.length).toBe(0);
	});

	it("can remove", function() {
		var pair = newPair(['A', 'x', 'C', 'x', 'D', 'x', 'E', 'x']);
		// single
		remove(pair, 'x');
		compare(pair); // A C x D x E x

		// arrays
		remove(pair, ['x', 'A', 'x']);
		compare(pair); // C D E x
	});

	it('can ignore removal of nonexistent items', function() {
		var pair = newPair(['A', 'B', 'C', 'D']);
		// single
		remove(pair, 'Z');
		compare(pair); // A B C D

		// array
		remove(pair, ['Z', 'B', 'X']);
		compare(pair); // A C D
	});

	it('can iterate with each', function() {
		var list = new $tw.utils.LinkedList();
		list.push('0', '1', '2', '3');
		var counter = 0;
		list.each(function(value) {
			expect(value).toBe(counter.toString());
			counter = counter + 1;
		});
		expect(counter).toBe(4);
	});

	it('can iterate a list of the same item', function() {
		var pair = newPair(['A', 'A']);
		compare(pair);
	});
});

})();
