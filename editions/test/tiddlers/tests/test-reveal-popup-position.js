/*\
title: test-reveal-popup-position.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests popup auto positioning behavior in the Reveal widget.

\*/

"use strict";

describe("Reveal popup positioning tests", function() {
	var RevealWidget = require("$:/core/modules/widgets/reveal.js").reveal;

	// Use a 600x500 container, matching the demo container, so tests exercise real bounds.
	function createDomNode(width,height,containerWidth,containerHeight) {
		return {
			style: {},
			offsetWidth: width,
			offsetHeight: height,
			offsetParent: {
				offsetWidth: containerWidth || 600,
				offsetHeight: containerHeight || 500,
				clientLeft: 0,
				clientTop: 0,
				offsetLeft: 0,
				offsetTop: 0,
				offsetParent: null,
				getBoundingClientRect: function() {
					return {left: 0, top: 0};
				}
			}
		};
	}

	function createRevealWidgetState(popup,position,clamp) {
		return {
			popup: popup,
			position: position,
			clampToParent: clamp,
			positionAllowNegative: false
		};
	}

	// Container: 600x500. Trigger at left=50, top=430 (near bottom).
	// popup 120x80: below top=450, bottom=530 > 500. above top=350, bottom=430 fits. Expect flip to above.
	it("should flip to above when below overflows container bottom", function() {
		var domNode = createDomNode(120,80),
			widgetState = createRevealWidgetState({
				absolute: false,
				left: 50,
				top: 430,
				width: 20,
				height: 20
			},"below","auto");
		RevealWidget.prototype.positionPopup.call(widgetState,domNode);
		expect(domNode.style.left).toBe("50px");
		expect(domNode.style.top).toBe("350px");
	});

	// Container: 600x500. Trigger at left=50, top=200. popup 120x80.
	// below top=220, bottom=300 fits. Expect preferred direction kept.
	it("should keep preferred direction when it fits", function() {
		var domNode = createDomNode(120,80),
			widgetState = createRevealWidgetState({
				absolute: false,
				left: 50,
				top: 200,
				width: 20,
				height: 20
			},"below","auto");
		RevealWidget.prototype.positionPopup.call(widgetState,domNode);
		expect(domNode.style.left).toBe("50px");
		expect(domNode.style.top).toBe("220px");
	});

	// Container: 600x500. Trigger at left=520, top=200. popup 200x80.
	// below left=520, right=720 > 600-5=595. Shift left to 595-200=395.
	it("should shift horizontally to stay inside container", function() {
		var domNode = createDomNode(200,80),
			widgetState = createRevealWidgetState({
				absolute: false,
				left: 520,
				top: 200,
				width: 20,
				height: 20
			},"below","auto");
		RevealWidget.prototype.positionPopup.call(widgetState,domNode);
		expect(domNode.style.left).toBe("395px");
		expect(domNode.style.top).toBe("220px");
	});

	// clamp="none": raw coordinates placed without adjustment.
	it("should keep legacy fixed-direction behavior when clamp is none", function() {
		var domNode = createDomNode(120,80),
			widgetState = createRevealWidgetState({
				absolute: false,
				left: 50,
				top: 430,
				width: 20,
				height: 20
			},"below","none");
		RevealWidget.prototype.positionPopup.call(widgetState,domNode);
		expect(domNode.style.left).toBe("50px");
		expect(domNode.style.top).toBe("450px");
	});
});
