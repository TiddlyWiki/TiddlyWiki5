/*\
title: test-widget-event.js
type: application/javascript
tags: [[$:/tags/test-spec]]
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

describe("Widget Event Listeners", function() {
	var widget = require("$:/core/modules/widgets/widget.js");

	function createWidgetNode(parseTreeNode,wiki,parentWidget) {
		return new widget.widget(parseTreeNode,{
			wiki: wiki,
			document: $tw.fakeDocument,
			parentWidget: parentWidget
		});
	}

	it("should call all added event listeners on dispatchEvent", function() {
		var calls = [];
		var wiki = new $tw.Wiki();
		var widget = createWidgetNode({type:"widget", text:"text"}, wiki);

		// Add a function listener.
		widget.addEventListener("testEvent", function(e) {
			calls.push("funcListener");
			return true;
		});
		// Setup a method on widget for string listener.
		widget.testHandler = function(e) {
			calls.push("methodListener");
			return true;
		};
		widget.addEventListener("testEvent", "testHandler");

		var event = {type:"testEvent"};
		var result = widget.dispatchEvent(event);
		expect(result).toBe(true);
		expect(calls.length).toBe(2);
		expect(calls).toContain("funcListener");
		expect(calls).toContain("methodListener");
	});

	it("should remove an event listener correctly", function() {
		var calls = [];
		var wiki = new $tw.Wiki();
		var widget = createWidgetNode({type:"widget", text:"text"}, wiki);

		function listener(e) {
			calls.push("listener");
			return true;
		}
		// Add listener twice: once as function and then add another distinct listener.
		widget.addEventListener("removeTest", listener);
		widget.addEventListener("removeTest", function(e) {
			calls.push("secondListener");
			return true;
		});
		// Remove the function listener.
		widget.removeEventListener("removeTest", listener);

		var event = {type:"removeTest"};
		var result = widget.dispatchEvent(event);
		expect(result).toBe(true);
		expect(calls.length).toBe(1);
		expect(calls).toContain("secondListener");
		expect(calls).not.toContain("listener");
	});

	it("stop further propagation by returns false won't block other listeners on the same level.", function() {
		var calls = [];
		var wiki = new $tw.Wiki();
		var widget = createWidgetNode({type:"widget", text:"text"}, wiki);

		widget.addEventListener("stopEvent", function(e) {
			calls.push("first");
			// stops further propagation, but still dispatch event for second listener.
			return false;
		});
		widget.addEventListener("stopEvent", function(e) {
			calls.push("second");
			return true;
		});
		var event = {type:"stopEvent"};
		var result = widget.dispatchEvent(event);
		expect(result).toBe(false);
		expect(calls.length).toBe(2);
		expect(calls).toContain("first");
		expect(calls).toContain("second");
	});

	it("should dispatch event to parent widget if not handled on child", function() {
		var parentCalls = [];
		var wiki = new $tw.Wiki();
		var parentWidget = createWidgetNode({type:"widget", text:"text"}, wiki);
		parentWidget.addEventListener("parentEvent", function(e) {
			parentCalls.push("parentListener");
			return true;
		});
		// Create a child with parentWidget assigned.
		var childWidget = createWidgetNode({type:"widget", text:"text"}, wiki, parentWidget);
		// No listener on child; so dispatch should bubble up.
		var event = {type:"parentEvent"};
		var result = childWidget.dispatchEvent(event);
		expect(result).toBe(true);
		expect(parentCalls.length).toBe(1);
		expect(parentCalls).toContain("parentListener");
	});

	it("should not dispatch event to parent if child's listener stops propagation", function() {
		var parentCalls = [];
		var wiki = new $tw.Wiki();
		var parentWidget = createWidgetNode({type:"widget", text:"text"}, wiki);
		parentWidget.addEventListener("bubbleTest", function(e) {
			parentCalls.push("parentListener");
			return true;
		});
		var childWidget = createWidgetNode({type:"widget", text:"text"}, wiki, parentWidget);
		childWidget.addEventListener("bubbleTest", function(e) {
			return false; // Stop event propagation
		});
		var event = {type:"bubbleTest"};
		var result = childWidget.dispatchEvent(event);
		expect(result).toBe(false);
		expect(parentCalls.length).toBe(0);
	});

	it("should call multiple listeners in proper order across child and parent", function() {
		var calls = [];
		var wiki = new $tw.Wiki();
		var parentWidget = createWidgetNode({type:"widget", text:"text"}, wiki);
		parentWidget.addEventListener("chainEvent", function(e) {
			calls.push("parentListener");
			return true;
		});
		var childWidget = createWidgetNode({type:"widget", text:"text"}, wiki, parentWidget);
		childWidget.addEventListener("chainEvent", function(e) {
			calls.push("childListener");
			return true;
		});
		var event = {type:"chainEvent"};
		var result = childWidget.dispatchEvent(event);
		expect(result).toBe(true);
		expect(calls.length).toBe(2);
		// First call from child widget and then parent's listener.
		expect(calls[0]).toBe("childListener");
		expect(calls[1]).toBe("parentListener");
	});

	// Additional tests for multiple event types
	it("should handle events of different types separately", function() {
		var callsA = [];
		var callsB = [];
		var wiki = new $tw.Wiki();
		var widget = createWidgetNode({type:"widget", text:"text"}, wiki);
		widget.addEventListener("eventA", function(e) {
			callsA.push("A1");
			return true;
		});
		widget.addEventListener("eventB", function(e) {
			callsB.push("B1");
			return true;
		});
		widget.dispatchEvent({type:"eventA"});
		widget.dispatchEvent({type:"eventB"});
		expect(callsA).toContain("A1");
		expect(callsB).toContain("B1");
	});

	// Test using $tw.utils.each in removeEventListener internally (behavior verified via dispatch)
	it("should remove listeners using $tw.utils.each without affecting other listeners", function() {
		var calls = [];
		var wiki = new $tw.Wiki();
		var widget = createWidgetNode({type:"widget", text:"text"}, wiki);
		function listener1(e) {
			calls.push("listener1");
			return true;
		}
		function listener2(e) {
			calls.push("listener2");
			return true;
		}
		widget.addEventListener("testRemove", listener1);
		widget.addEventListener("testRemove", listener2);
		widget.removeEventListener("testRemove", listener1);
		widget.dispatchEvent({type:"testRemove"});
		expect(calls.length).toBe(1);
		expect(calls).toContain("listener2");
		expect(calls).not.toContain("listener1");
	});

	it("should prevent adding the same event listener multiple times", function() {
		var calls = 0;
		var wiki = new $tw.Wiki();
		var widget = createWidgetNode({type:"widget", text:"text"}, wiki);
		
		function listener(e) {
			calls++;
			return true;
		}
		
		// Add the same listener multiple times
		widget.addEventListener("testEvent", listener);
		widget.addEventListener("testEvent", listener);
		widget.addEventListener("testEvent", listener);
		
		// Dispatch the event
		var event = {type:"testEvent"};
		widget.dispatchEvent(event);
		
		// The listener should only be called once
		expect(calls).toBe(1);
		
		// Check the internal structure of eventListeners array
		expect(widget.eventListeners["testEvent"].length).toBe(1);
	});

});

})();
