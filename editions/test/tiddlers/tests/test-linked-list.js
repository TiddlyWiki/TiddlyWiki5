/*\
title: test-linked-list.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the utils.LinkedList class.

LinkedList was built to behave exactly as $tw.utils.pushTop and
Array.prototype.push would behave with an array.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

describe("LinkedList class tests", function() {

	it("can pushTop", function() {
		var list = new $tw.utils.LinkedList();
		list.push('A', 'B', 'C');
		// singles
		list.pushTop('X');
		list.pushTop('B');
		expect(list.toArray()).toEqual(['A', 'C', 'X', 'B']);
		expect(list.length).toBe(4);
		//arrays
		list.pushTop(['X', 'A', 'G', 'A']);
		// If the pushedTopped list has duplicates, they go in unempeded.
		expect(list.toArray()).toEqual(['C', 'B', 'X', 'A', 'G', 'A']);
		expect(list.length).toBe(6);
	});

	it("can pushTop with tricky duplicates", function() {
		var list = new $tw.utils.LinkedList();
		list.push('A', 'B', 'A', 'C', 'A', 'end');
		// If the original list contains duplicates, only one instance is cut
		list.pushTop('A');
		expect(list.toArray()).toEqual(['B', 'A', 'C', 'A', 'end', 'A']);
		expect(list.length).toBe(6);

		// And the Llist properly knows the next 'A' to cut if pushed again
		list.pushTop(['X', 'A']);
		expect(list.toArray()).toEqual(['B', 'C', 'A', 'end', 'A', 'X', 'A']);
		expect(list.length).toBe(7);

		// One last time, to make sure we maintain the linked chain of copies
		list.pushTop('A');
		expect(list.toArray()).toEqual(['B', 'C', 'end', 'A', 'X', 'A', 'A']);
		expect(list.length).toBe(7);
	});

	it("can handle particularly nasty pushTop pitfall", function() {
		var list = new $tw.utils.LinkedList();
		list.push('A', 'B', 'A', 'C');
		list.pushTop('A'); // BACA
		list.pushTop('X'); // BACAX
		list.remove('A');  // BCAX
		list.pushTop('A'); // BCXA
		list.remove('A');  // BCX
		// But! The way I initially coded the copy chains, a mystery A could
		// hang around.
		expect(list.toArray()).toEqual(['B', 'C', 'X']);
		expect(list.length).toBe(3);
	});

	it("can push", function() {
		var list = new $tw.utils.LinkedList();
		list.push('A', 'B', 'C');
		// singles
		list.push('B');
		expect(list.toArray()).toEqual(['A', 'B', 'C', 'B']);
		expect(list.length).toBe(4);

		// multiple args
		list.push('A', 'B', 'C');
		expect(list.toArray()).toEqual(['A', 'B', 'C', 'B', 'A', 'B', 'C']);
		expect(list.length).toBe(7);
	});

	it("can clear", function() {
		var list = new $tw.utils.LinkedList();
		list.push('A', 'B', 'C');
		list.clear();
		expect(list.toArray()).toEqual([]);
		expect(list.length).toBe(0);
	});

	it("can remove", function() {
		var list = new $tw.utils.LinkedList();
		list.push('A', 'x', 'C', 'x', 'D', 'x', 'E', 'x');
		// single
		list.remove('x');
		expect(list.toArray()).toEqual(['A', 'C', 'x', 'D', 'x', 'E', 'x']);
		expect(list.length).toBe(7);

		// arrays
		list.remove(['x', 'A', 'x']);
		expect(list.toArray()).toEqual(['C', 'D', 'E', 'x']);
		expect(list.length).toBe(4);
	});

	it('can ignore removal of nonexistent items', function() {
		var list = new $tw.utils.LinkedList();
		list.push('A', 'B', 'C', 'D');
		// single
		list.remove('Z');
		expect(list.toArray()).toEqual(['A', 'B', 'C', 'D']);
		expect(list.length).toBe(4);

		// array
		list.remove(['Z', 'B', 'X']);
		expect(list.toArray()).toEqual(['A', 'C', 'D']);
		expect(list.length).toBe(3);
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
