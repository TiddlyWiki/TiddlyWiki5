/*\
title: test-action-widgets.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the action widgets.

\*/


/* jslint node: true, browser: true */
/* eslint-env node, browser, jasmine */
/* eslint no-mixed-spaces-and-tabs: ["error", "smart-tabs"]*/
/* global $tw, require */
"use strict";

describe("Action widget tests", function() {

function setupWiki(wikiOptions) {
	wikiOptions = wikiOptions || {};
	// Create a wiki
	var wiki = new $tw.Wiki(wikiOptions);
	var tiddlers = [{
		title: "Root",
		text: "Some dummy content"
	}];
	wiki.addTiddlers(tiddlers);
	wiki.addIndexersToWiki();
	var widgetNode = wiki.makeTranscludeWidget("Root",{document: $tw.fakeDocument, parseAsInline: true});
	var container = $tw.fakeDocument.createElement("div");
	widgetNode.render(container,null);
	return {
		wiki: wiki,
		widgetNode: widgetNode,
		contaienr: container
	};
}

it("should handle the action-setfield widget", function() {
	var info = setupWiki();
	var invokeActions = function(actions) {
		info.widgetNode.invokeActionString(actions,info.widgetNode,null,{});
	};
	var resetTiddlers = function() {
		info.wiki.addTiddlers([
			{
				title: "Output",
				text: "Elephants!"
			},{
				title: "Root",
				text: "Eagles!"
			}
		]);
	};
	// Start with a reset
	resetTiddlers();
	// Check it
	expect(info.wiki.getTiddlerText("Output")).toBe("Elephants!");
	expect(info.wiki.getTiddlerText("Root")).toBe("Eagles!");
	// Missing $tiddler attribute
	resetTiddlers();
	invokeActions("<$tiddler tiddler='Root'><$action-setfield $field='text' $value='Hippos!'/></$tiddler>");
	expect(info.wiki.getTiddlerText("Output")).toBe("Elephants!");
	expect(info.wiki.getTiddlerText("Root")).toBe("Hippos!");
	// Blank $tiddler attribute
	resetTiddlers();
	invokeActions("<$tiddler tiddler='Root'><$action-setfield $tiddler='' $field='text' $value='Koalas!'/></$tiddler>");
	expect(info.wiki.getTiddlerText("Output")).toBe("Elephants!");
	expect(info.wiki.getTiddlerText("Root")).toBe("Eagles!");
	// Empty $tiddler attribute
	resetTiddlers();
	invokeActions("<$tiddler tiddler='Root'><$action-setfield $tiddler={{{}}} $field='text' $value='Sharks!'/></$tiddler>");
	expect(info.wiki.getTiddlerText("Output")).toBe("Elephants!");
	expect(info.wiki.getTiddlerText("Root")).toBe("Eagles!");
	// Missing variable attribute
	resetTiddlers();
	invokeActions("<$tiddler tiddler='Root'><$action-setfield $tiddler=<<missing>> $field='text' $value='Tigers!'/></$tiddler>");
	expect(info.wiki.getTiddlerText("Output")).toBe("Elephants!");
	expect(info.wiki.getTiddlerText("Root")).toBe("Eagles!");
});

it("should handle the action-listops widget", function() {
	var info = setupWiki();
	var invokeActions = function(actions) {
		info.widgetNode.invokeActionString(actions,info.widgetNode,null,{});
	};
	invokeActions("<$action-setfield $tiddler='Output' $field='text' $value='Elephants!'/>");
	expect(info.wiki.getTiddlerText("Output")).toBe("Elephants!");
	invokeActions("<$action-listops  $tiddler='Output' $field='text' $subfilter='+[toggle[-3]]'/>");
	expect(info.wiki.getTiddlerText("Output")).toBe("Elephants! -3");
	invokeActions("<$action-listops  $tiddler='Output' $field='text' $subfilter='+[toggle[-3]]'/>");
	expect(info.wiki.getTiddlerText("Output")).toBe("Elephants!");
});

});

