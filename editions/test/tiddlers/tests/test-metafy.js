/*\
title: test-metafy.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the metafy mechanism.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

describe("Metafy tests", function() {

	// Create a new and independent wiki
	var wiki = new $tw.Wiki();
	
	// need to copy over the core tiddlers under test
	wiki.addTiddler($tw.wiki.getTiddler("$:/core/templates/plain-javascript-tiddler"));
	wiki.addTiddler($tw.wiki.getTiddler("$:/core/modules/widgets/metafy.js"));
	
	// establish the test-bed
	wiki.addTiddler({
		title: "UncommentedJavaScript.js",
		text: "return;",
		type: "application/javascript"
	});
	
	wiki.addTiddler({
		title: "CommentedJavaScript.js",
		text: "/*\\\ntoast-field: Toast!\n\nSome comments, please!\n\\*/\nreturn;",
		type: "application/javascript",
		modifier: "JamesDoe42"
	});
	
	wiki.addTiddler({
		title: "render-uncommented",
		text: "<$tiddler tiddler=\"UncommentedJavaScript.js\"><$transclude tiddler=\"$:/core/templates/plain-javascript-tiddler\" mode=\"block\"/></$tiddler>"
	});

	wiki.addTiddler({
		title: "render-commented",
		text: "<$tiddler tiddler=\"CommentedJavaScript.js\"><$transclude tiddler=\"$:/core/templates/plain-javascript-tiddler\" mode=\"block\"/></$tiddler>"
	});
	
	it("should render uncommented javascript with a default meta section", function() {
		expect(wiki.renderTiddler("text/plain", "render-uncommented")).toBe("/*\\\ntitle: UncommentedJavaScript.js\ntype: application/javascript\n\\*/\nreturn;");
	});
	
	it("should render commented javascript with a replaced meta section", function() {
		expect(wiki.renderTiddler("text/plain", "render-commented")).toBe("/*\\\ntitle: CommentedJavaScript.js\ntype: application/javascript\nmodifier: JamesDoe42\n\nSome comments, please!\n\\*/\nreturn;");
	});
});

})();
