/*\
title: test-action-widgets.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the action widgets.

\*/
(function(){

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

})();
	
