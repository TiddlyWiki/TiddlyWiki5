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

NOTE TO FURTHER LINKED LIST DEVELOPERS:

	If you want to add new functionality, like 'shift' or 'unshift', you'll
	probably need to deal with the fact that Linked List will insert undefined
	as a first entry into an item's 'prev' array when it's at the front of
	the list, but it doesn't do the same for the 'next' array when it's at
	the end. I think you'll probably be better off preventing 'prev' from ever
	adding undefined.
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
		return pair;
	};

	// pushes values into both the array and the linked list.
	function push(pair, values) {
		pair.list.push(values);
		pair.array.push.apply(pair.array, values);
		return pair;
	};

	// operates a remove action on an array and a linked list in parallel.
	function remove(pair, valueOrValues) {
		pair.list.remove(valueOrValues);
		$tw.utils.removeArrayEntries(pair.array, valueOrValues);
		return pair;
	};

	// compares an array and a linked list to make sure they match up
	function compare(pair) {
		expect(pair.list.toArray()).toEqual(pair.array);
		expect(pair.list.length).toBe(pair.array.length);
		return pair;
	};

	it("can pushTop", function() {
		var pair = newPair(["A", "B", "C"]);
		// singles
		pushTop(pair, "X");
		pushTop(pair, "B");
		compare(pair); // ACXB
		//arrays
		pushTop(pair, ["X", "A", "G", "A"]);
		// If the pushedTopped list has duplicates, they go in unempeded.
		compare(pair); // CBXAGA
	});

	it("can pushTop with tricky duplicates", function() {
		var pair = newPair(["A", "B", "A", "C", "A", "e"]);
		// If the original list contains duplicates, only one instance is cut
		compare(pushTop(pair, "A")); // BACAeA

		// And the Llist properly knows the next 'A' to cut if pushed again
		compare(pushTop(pair, ["X", "A"])); // BCAeAXA

		// One last time, to make sure we maintain the linked chain of copies
		compare(pushTop(pair, "A")); // BCeAXAA
	});

	it("can pushTop a single-value list with itself", function() {
		// This simple case actually requires special handling in LinkedList.
		compare(pushTop(newPair(["A"]), "A")); // A
	});

	it("can remove all instances of a multi-instance value", function() {
		var pair = compare(remove(newPair(["A", "A"]), ["A", "A"])); //
		// Now add 'A' back in, since internally it might be using arrays,
		// even though those arrays must be empty.
		compare(pushTop(pair, "A")); // A
		// Same idea, but push something else before readding 'A'
		compare(pushTop(remove(newPair(["A", "A"]), ["A", "A"]), ["B", "A"])); // BA

		// Again, but this time with other values mixed in
		compare(remove(newPair(["B", "A", "A", "C"]), ["A", "A"])) // BC;
		// And again, but this time with value inbetween too.
		compare(remove(newPair(["B", "A", "X", "Y", "Z", "A", "C"]), ["A", "A"])); // BXYZC

		// One last test, where removing a pair from the end could corrupt
		// list.last.
		pair = remove(newPair(["D", "C", "A", "A"]), ["A", "A"]);
		// But I can't figure out another way to test this. It's wrong
		// for list.last to be anything other than a string, but I
		// can't figure out how to make that corruption manifest a problem.
		// So I dig into its private members. Bleh...
		expect(typeof pair.list.last).toBe("string");
	});

	it("can pushTop value linked to by a repeat item", function() {
		var pair = newPair(["A", "B", "A", "C", "A", "C", "D"]);
		// This is tricky because that 'C' is referenced by a second 'A'
		// It WAS a crash before
		pushTop(pair, "C");
		compare(pair); // ABAACDC
	});

	it("can pushTop last value after pair", function() {
		// The 'next' ptrs for A would be polluted with an extraneous
		// undefined after the pop, which would make pushing the 'X'
		// back on problematic.
		compare(pushTop(newPair(["A", "A", "X"]), "X")); // AACX
		// And lets try a few other manipulations around pairs
		compare(pushTop(newPair(["A", "A", "X", "C"]), "X")); // AACX
		compare(pushTop(newPair(["X", "A", "A"]), "X")); // AAX
		compare(pushTop(newPair(["C", "X", "A", "A"]), "X")); // CAAX
	});

	it("can handle particularly nasty pushTop pitfall", function() {
		var pair = newPair(["A", "B", "A", "C"]);
		pushTop(pair, "A"); // BACA
		pushTop(pair, "X"); // BACAX
		remove(pair, "A");  // BCAX
		pushTop(pair, "A"); // BCXA
		remove(pair, "A");  // BCX

		// But! The way I initially coded the copy chains, a mystery A could
		// hang around.
		compare(pair); // BCX
	});

	it("can handle past-duplicate items when pushing", function() {
		var pair = newPair(["X", "Y", "A", "C", "A"]);
		// Removing an item, when it has a duplicat at the list's end
		remove(pair, "A");
		compare(pair); // XYCA
		// This actually caused an infinite loop once. So important test here.
		push(pair, ["A"]);
		compare(pair); // XYCAA
		pushTop(pair, "A") // switch those last As
		compare(pair); // XYCAA
		remove(pair, ["A", "A"]); // Remove all As, then add them back
		pushTop(pair, ["A", "A"])
		compare(pair); // XYCAA
	});

	it("can push", function() {
		var list = new $tw.utils.LinkedList();
		// singles
		expect(list.push("A")).toBe(1);
		expect(list.push("B")).toBe(2);
		// multiple args
		expect(list.push("C", "D", "E")).toBe(5);
		// array arg allowed
		expect(list.push(["F", "G"])).toBe(7);
		// No-op
		expect(list.push()).toBe(7);
		expect(list.toArray()).toEqual(["A", "B", "C", "D", "E", "F", "G"]);
	});

	it("can handle empty string", function() {
		compare(newPair(["", "", ""])); // ___
		compare(push(newPair([""]), [""])); // __
		compare(pushTop(newPair(["", "", ""]), ["A", ""])); // __A_
		compare(remove(newPair(["", "A"]), "A")); // _
		compare(push(newPair(["", "A"]), ["A"])); // _AA
		compare(remove(newPair(["A", ""]), "A")); // _
		compare(push(newPair(["A", ""]), ["A"])); // A_A

		// This one is tricky but precise. Remove 'B', and 'A' might mistake
		// it as being first in the list since it's before ''. 'C' would get
		// blasted from A's prev reference array.
		compare(remove(newPair(["C", "A", "", "B", "A"]), ["B", "A"])); // C_A
		// Same idea, but with A mistaking B for being at the list's end, and
		// thus removing C from its 'next' reference array.
		compare(remove(newPair(["A", "B", "", "A", "C"]), ["B", "A"])); // _AC
	});

	it("will throw if told to push non-strings", function() {
		var message = "Linked List only accepts string values, not ";
		var list = new $tw.utils.LinkedList();
		expect(() => list.push(undefined)).toThrow(message + "undefined");
		expect(() => list.pushTop(undefined)).toThrow(message + "undefined");
		expect(() => list.pushTop(["c", undefined])).toThrow(message + "undefined");
		expect(() => list.pushTop(5)).toThrow(message + "5");
		expect(() => list.pushTop(null)).toThrow(message + "null");

		// now lets do a quick test to make sure this exception
		// doesn't leave any side-effects
		// A.K.A Strong guarantee
		var pair = newPair(["A", "5", "B", "C"]);
		expect(() => pushTop(pair, 5)).toThrow(message + "5");
		compare(pair);
		expect(() => push(pair, ["D", 7])).toThrow(message + "7");
		compare(pair);
		expect(() => remove(pair, 5)).toThrow(message + "5");
		compare(pair);
		// This is the tricky one. 'A' and 'B' should not be removed or pushed.
		expect(() => pushTop(pair, ["A", "B", null])).toThrow(message + "null");
		compare(pair);
		expect(() => remove(pair, ["A", "B", null])).toThrow(message + "null");
		compare(pair);
	});

	it("can clear", function() {
		var list = new $tw.utils.LinkedList();
		list.push("A", "B", "C");
		list.clear();
		expect(list.toArray()).toEqual([]);
		expect(list.length).toBe(0);
	});

	it("can remove", function() {
		var list = new $tw.utils.LinkedList();
		list.push(["A", "x", "C", "x", "D", "x", "E", "x"]);
		// single
		list.remove("x");
		// arrays
		list.remove(["x", "A", "XXX", "x"]);
		expect(list.toArray()).toEqual(["C", "D", "E", "x"]);
	});

	it("can ignore removal of nonexistent items", function() {
		var pair = newPair(["A", "B", "C", "D"]);
		// single
		compare(remove(pair, "Z")); // ABCD

		// array
		compare(remove(pair, ["Z", "B", "X"])); // ACD
	});

	it("can iterate with each", function() {
		var list = new $tw.utils.LinkedList();
		list.push("0", "1", "2", "3");
		var counter = 0;
		list.each(function(value) {
			expect(value).toBe(counter.toString());
			counter = counter + 1;
		});
		expect(counter).toBe(4);
	});

	it("can iterate a list of the same item", function() {
		// Seems simple. Caused an infinite loop during development.
		compare(newPair(["A", "A"]));
	});
});

})();
