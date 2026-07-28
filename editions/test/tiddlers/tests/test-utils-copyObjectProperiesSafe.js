/*\
title: test-utils-copyObjectPropertiesSafe.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests $tw.utils.copyObjectPropertiesSafe, the root cause of #9869.

$eventcatcher serialises DOM events via JSON.stringify(copyObjectPropertiesSafe(event)).

The original bug was caused by instanceof Node/Window being realm-specific.
When an event originated from a different browser window, DOM objects from that
window were not detected and JSON.stringify() could throw "Illegal invocation".

The implementation must:
- skip DOM nodes and Window objects from other realms
- preserve normal event data
- preserve CustomEvent.detail payloads
- continue copying enumerable properties from non-DOM objects
- preserve arrays and break circular references

The tests use substitutes for foreign DOM objects because headless Node does not
provide a second browser realm. These objects model the important characteristics:
DOM nodes have nodeType/nodeName, and Window objects have window/self/document.
\*/

"use strict";

describe("copyObjectPropertiesSafe (#9869)", function() {

	var cops = $tw.utils.copyObjectPropertiesSafe;

	// Simulates a DOM node from another realm.
	// The important characteristics are:
	// - nodeType/nodeName identify it as a DOM node
	// - circular parentNode references resemble real DOM trees
	function fakeElement(tagName,extra) {
		var node = $tw.utils.extend({
			nodeType: 1,
			nodeName: tagName,
			tagName: tagName
		},extra || {});

		node.parentNode = node;
		return node;
	}

	// Simulates a Window object from another realm.
	function fakeWindow() {
		var win = {
			document: {},
			location: {}
		};

		win.window = win;
		win.self = win;

		return win;
	}

	// An event carrying foreign DOM nodes and a Window.
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


	it("does not throw serialising any event type from a secondary window", function() {
		var events = [
			fakeEvent("focusin",fakeElement("INPUT")),
			fakeEvent("change",fakeElement("SELECT")),
			fakeEvent("click",fakeElement("BUTTON"),{
				button: 0,
				clientX: 5,
				clientY: 9,
				relatedTarget: null
			}),
			fakeEvent("mouseover",fakeElement("DIV"),{
				relatedTarget: fakeElement("SPAN")
			})
		];

		events.forEach(function(event) {
			expect(function() {
				JSON.stringify(cops(event));
			}).not.toThrow();
		});
	});


	it("drops DOM nodes and Window but keeps serialisable event data", function() {
		var event = fakeEvent("click",fakeElement("BUTTON"),{
			button: 0,
			clientX: 5,
			clientY: 9
		});

		var result = JSON.parse(JSON.stringify(cops(event)));

		expect(result.target).toBeUndefined();
		expect(result.currentTarget).toBeUndefined();
		expect(result.view).toBeUndefined();

		expect(result.type).toBe("click");
		expect(result.detail).toBe(0);
		expect(result.isTrusted).toBe(true);
		expect(result.button).toBe(0);
		expect(result.clientX).toBe(5);
		expect(result.clientY).toBe(9);
	});


	it("preserves nested objects, arrays and circular reference handling", function() {
		var event = fakeEvent("custom",fakeElement("DIV"),{
			detail: {
				nested: {
					a: 1,
					b: [2,3]
				}
			},
			path: [
				fakeElement("DIV"),
				fakeWindow(),
				42
			]
		});

		event.self = event;

		var result = JSON.parse(JSON.stringify(cops(event)));

		expect(result.detail).toEqual({
			nested: {
				a: 1,
				b: [2,3]
			}
		});

		expect(result.path).toEqual([
			null,
			null,
			42
		]);

		expect(result.self).toBeUndefined();
	});


	it("preserves CustomEvent.detail objects including custom object instances", function() {
		function DetailObject() {
			this.name = "example";
			this.values = [1,2,3];
		}

		var event = fakeEvent("custom",fakeElement("DIV"),{
			detail: new DetailObject()
		});

		var result = JSON.parse(JSON.stringify(cops(event)));

		expect(result.detail).toEqual({
			name: "example",
			values: [1,2,3]
		});
	});


	it("preserves CustomEvent.detail objects while dropping DOM objects inside them", function() {
		var event = fakeEvent("custom",fakeElement("DIV"),{
			detail: {
				value: 123,
				nested: {
					target: fakeElement("SPAN"),
					kept: "yes"
				},
				items: [
					fakeElement("BUTTON"),
					42
				]
			}
		});

		var result = JSON.parse(JSON.stringify(cops(event)));

		expect(result.detail.value).toBe(123);

		expect(result.detail.nested.target).toBeUndefined();
		expect(result.detail.nested.kept).toBe("yes");

		expect(result.detail.items).toEqual([
			null,
			42
		]);
	});


	it("accepts primitive, array and object arguments", function() {
		var nullProto = Object.create(null);
		nullProto.kept = true;

		expect(cops(42)).toBe(42);
		expect(cops(null)).toBe(null);

		expect(cops([
			1,
			"two",
			{three: 3}
		])).toEqual([
			1,
			"two",
			{three: 3}
		]);

		expect(cops({
			a: 1,
			b: {
				c: 2
			}
		})).toEqual({
			a: 1,
			b: {
				c: 2
			}
		});

		expect(JSON.parse(JSON.stringify(cops({
			nullProto: nullProto
		})))).toEqual({
			nullProto: {
				kept: true
			}
		});
	});

});