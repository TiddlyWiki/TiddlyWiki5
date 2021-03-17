/*\
title: test-linked-list.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the utils.LinkedList class.

LinkedList was built to behave exactly as $tw.utils.pushTop and
Array.prototype.push would behave with an array.

Many of these tests function by performing operations on a LinkedList while
performing the equivalent actions on an array with the old utility methods.
Then we confirm that the two come out functionally identical.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

describe("LinkedList class tests", function() {

	// pushTops a value or array of values into both the array and linked list.
	function pushTop(array, linkedList, valueOrValues) {
		$tw.utils.pushTop(array, valueOrValues);
		linkedList.pushTop(valueOrValues);
	};

	// pushes values into both the array and the linked list.
	function push(array, linkedList/*, other values */) {
		var values = Array.prototype.slice(arguments, 2);
		array.push.apply(array, values);
		linkedList.push.apply(linkedList, values);
	};

	// operates a remove action on an array and a linked list in parallel.
	function remove(array, linkedList, valueOrValues) {
		$tw.utils.removeArrayEntries(array, valueOrValues);
		linkedList.remove(valueOrValues);
	};

	// compares an array and a linked list to make sure they match up
	function compare(array, linkedList) {
		expect(linkedList.toArray()).toEqual(array);
		expect(linkedList.length).toBe(array.length);
	};

	it("can pushTop", function() {
		var array = [];
		var list = new $tw.utils.LinkedList();
		push(array, list, 'A', 'B', 'C');
		// singles
		pushTop(array, list, 'X');
		pushTop(array, list, 'B');
		compare(array, list); // A C X B
		//arrays
		pushTop(array, list, ['X', 'A', 'G', 'A']);
		// If the pushedTopped list has duplicates, they go in unempeded.
		compare(array, list); // C B X A G A
	});

	it("can pushTop with tricky duplicates", function() {
		var array = [];
		var list = new $tw.utils.LinkedList();
		push(array, list, 'A', 'B', 'A', 'C', 'A', 'end');
		// If the original list contains duplicates, only one instance is cut
		pushTop(array, list, 'A');
		compare(array, list); // B A C A end A

		// And the Llist properly knows the next 'A' to cut if pushed again
		pushTop(array, list, ['X', 'A']);
		compare(array, list); // B C A end A X A

		// One last time, to make sure we maintain the linked chain of copies
		pushTop(array, list, 'A');
		compare(array, list); // B C end A X A A
	});

	it("can handle particularly nasty pushTop pitfall", function() {
		var array = [];
		var list = new $tw.utils.LinkedList();
		push(array, list, 'A', 'B', 'A', 'C');
		pushTop(array, list, 'A'); // BACA
		pushTop(array, list, 'X'); // BACAX
		remove(array, list, 'A');  // BCAX
		pushTop(array, list, 'A'); // BCXA
		remove(array, list, 'A');  // BCX

		// But! The way I initially coded the copy chains, a mystery A could
		// hang around.
		compare(array, list); // B C X
	});

	it("can push", function() {
		var array = [];
		var list = new $tw.utils.LinkedList();
		push(array, list, 'A', 'B', 'C');
		// singles
		push(array, list, 'B');
		compare(array, list); // A B C B

		// multiple args
		push(array, list, 'A', 'B', 'C');
		compare(array, list); // A B C B A B C
	});

	it("can clear", function() {
		var list = new $tw.utils.LinkedList();
		list.push('A', 'B', 'C');
		list.clear();
		expect(list.toArray()).toEqual([]);
		expect(list.length).toBe(0);
	});

	it("can remove", function() {
		var array = [];
		var list = new $tw.utils.LinkedList();
		push(array, list, 'A', 'x', 'C', 'x', 'D', 'x', 'E', 'x');
		// single
		remove(array, list, 'x');
		compare(array, list); // A C x D x E x

		// arrays
		remove(array, list, ['x', 'A', 'x']);
		compare(array, list); // C D E x
	});

	it('can ignore removal of nonexistent items', function() {
		var array = [];
		var list = new $tw.utils.LinkedList();
		push(array, list, 'A', 'B', 'C', 'D');
		// single
		remove(array, list, 'Z');
		compare(array, list); // A B C D

		// array
		remove(array, list, ['Z', 'B', 'X']);
		compare(array, list); // A C D
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
});

})();
