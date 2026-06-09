/*\
title: test-utils-copyObjectPropertiesSafe.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests $tw.utils.copyObjectPropertiesSafe, the root cause of #9869.

$eventcatcher serialises the DOM event via JSON.stringify(copyObjectPropertiesSafe(event)).
For an event from a separate browser window, target, view and other DOM properties
belong to that window's realm. The old guard used `instanceof Node`/`instanceof Window`,
which is realm specific, so those foreign objects were not skipped and JSON.stringify
threw "Illegal invocation". The reporter saw it for $focusin, $change, and ANY event
type from the secondary window.

Manual check: paste the snippet below into a running wiki's F12 console. A same origin
iframe is a real separate realm (cross realm like #9869, no popup blocker). The unfixed
build throws "Illegal invocation"; the fixed build passes. Needs the fixed build loaded.

	(function() {
		var f = document.createElement("iframe"); document.body.appendChild(f);
		try {
			var event = {type: "focusin", detail: 0, data: {a: 1, b: [2, 3]},
				target: f.contentDocument.createElement("input"), // real node, other realm
				view: f.contentWindow};                            // real foreign Window
			var crossRealm = !(event.target instanceof Node);      // true: realms differ
			var out = $tw.utils.copyObjectPropertiesSafe(event);   // unfixed: throws here
			var ok = crossRealm && !("target" in out) && !("view" in out)
				&& JSON.stringify(out.data) === '{"a":1,"b":[2,3]}';
			return (ok ? "PASS" : "FAIL") + " #9869, result=" + JSON.stringify(out);
		} catch(e) {
			return "BUG #9869 reproduced (unfixed build): " + e.name + ": " + e.message;
		} finally {
			f.remove();
		}
	})();

The full in situ repro is the issue's $eventcatcher wikitext plus "Open in new window".

Headless Node has no second window, so these specs use substitutes with the two traits
of a foreign DOM object: not an instance of this realm's Node or Window, and not a plain
object (deeper prototype chain, e.g. element -> Node.prototype -> Object.prototype).

\*/

"use strict";

describe("copyObjectPropertiesSafe (#9869)", function() {

	var cops = $tw.utils.copyObjectPropertiesSafe;

	// Build an object that, like a DOM node or Window from another window, is not a
	// plain data object: its prototype chain is one level deeper than {}.
	function foreignHostObject(props) {
		var hostPrototype = Object.create(Object.prototype); // stands in for Node/Window.prototype
		return $tw.utils.extend(Object.create(hostPrototype),props || {});
	}
	function fakeElement(tagName,extra) {
		var node = foreignHostObject($tw.utils.extend({nodeType: 1, tagName: tagName},extra || {}));
		node.parentNode = node; // self cycle, as in a real DOM tree
		return node;
	}
	function fakeWindow() {
		var win = foreignHostObject({});
		win.window = win; // a Window's window property points back at itself
		win.self = win;
		return win;
	}
	// An event as the reporter triggered it, carrying foreign DOM nodes and a Window.
	function fakeEvent(type,target,extra) {
		return $tw.utils.extend({
			type: type,
			target: target,
			currentTarget: target,
			view: fakeWindow(),
			detail: 0,
			isTrusted: true
		},extra || {});
	}

	// The central claim of #9869: serialising an event fired from a secondary window
	// must not throw, for ANY event type. Before the fix every one of these threw
	// "Illegal invocation".
	it("does not throw serialising any event type from a secondary window", function() {
		var events = [
			fakeEvent("focusin",fakeElement("INPUT")),  // edit-text widget with focus=yes
			fakeEvent("change",fakeElement("SELECT")),  // select widget
			fakeEvent("click",fakeElement("BUTTON"),{button: 0, clientX: 5, clientY: 9, relatedTarget: null}),
			fakeEvent("mouseover",fakeElement("DIV"),{relatedTarget: fakeElement("SPAN")})
		];
		events.forEach(function(event) {
			expect(function() { JSON.stringify(cops(event)); }).not.toThrow();
		});
	});

	// The foreign DOM nodes and Window are dropped, the serialisable data is kept.
	it("drops DOM nodes and Window but keeps serialisable event data", function() {
		var event = fakeEvent("click",fakeElement("BUTTON"),{button: 0, clientX: 5, clientY: 9});
		var result = JSON.parse(JSON.stringify(cops(event)));
		expect(result.target).toBeUndefined();        // foreign DOM node dropped
		expect(result.currentTarget).toBeUndefined();
		expect(result.view).toBeUndefined();           // foreign Window dropped
		expect(result.type).toBe("click");
		expect(result.detail).toBe(0);
		expect(result.isTrusted).toBe(true);
		expect(result.button).toBe(0);
		expect(result.clientX).toBe(5);
		expect(result.clientY).toBe(9);
	});

	// Distinct code paths: nested plain objects recurse, arrays are preserved with
	// dropped entries replaced by null, and circular references are broken.
	it("recurses plain objects, preserves arrays, and breaks cycles", function() {
		var event = fakeEvent("custom",fakeElement("DIV"),{
			detail: {nested: {a: 1, b: [2, 3]}},          // nested plain data
			path: [fakeElement("DIV"), fakeWindow(), 42]  // composedPath: nodes + window + number
		});
		event.self = event;                               // circular reference
		var result = JSON.parse(JSON.stringify(cops(event)));
		expect(result.detail).toEqual({nested: {a: 1, b: [2, 3]}});
		expect(result.path).toEqual([null, null, 42]);    // dropped node and window become null
		expect(result.self).toBeUndefined();              // cycle broken, no infinite recursion
	});

	// Plain object detection is by prototype chain, so it accepts both an object
	// literal and Object.create(null), and the function copies a primitive, array or
	// plain object passed as the top level argument.
	it("accepts plain objects and copies primitive, array and object arguments", function() {
		var nullProto = Object.create(null);
		nullProto.kept = true;
		var event = fakeEvent("custom",fakeElement("DIV"),{nullProto: nullProto});
		expect(JSON.parse(JSON.stringify(cops(event))).nullProto).toEqual({kept: true});
		expect(cops(42)).toBe(42);
		expect(cops(null)).toBe(null);
		expect(cops([1,"two",{three: 3}])).toEqual([1,"two",{three: 3}]);
		expect(cops({a: 1, b: {c: 2}})).toEqual({a: 1, b: {c: 2}});
	});

});
