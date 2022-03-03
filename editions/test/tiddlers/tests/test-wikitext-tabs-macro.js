/*\
title: test-wikitext-tabs-macro.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the tabs-macro, so there is _no_difference in the HTML structure between the existing implementation and 
future changes that should improve the code readability

Adding new functionality will probably change the "expected" html structur

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

describe("Tabs-macro HTML tests", function() {

	var coreTabsTiddler = $tw.wiki.getTiddler("$:/core/macros/tabs");
	var expected = $tw.wiki.getTiddler("expected-html-tabs.5.2.1")

	// Create a wiki
	var wiki = new $tw.Wiki();
	// Add a couple of tiddlers
	wiki.addTiddler({title: "TabOne",   text: "Text tab 1", caption:"t 1"});
	wiki.addTiddler({title: "TabTwo",   text: "Text tab 2", caption:"t 2"});
	wiki.addTiddler({title: "TabThree", text: "Text tab 3", caption:"t 3"});
	wiki.addTiddler({title: "TabFour",  text: "Text tab 4"});
	wiki.addTiddler({title: "tabs-macro-definition",  text: coreTabsTiddler.fields.text});
	wiki.addTiddler({title: "test-tabs-macro-01",  text: '\\import [[tabs-macro-definition]]\n<<tabs "TabOne TabTwo TabThree TabFour" "TabTwo" "$:/state/test-tab-01">>'});

	it("should render tabs V5.2.1", function() {
		expect(wiki.renderTiddler("text/html","test-tabs-macro-01")).toBe(expected.fields.text);
	});

	xit("should render tabs from V5.2.2 and up with whitespace trim", function() {
		expect(wiki.renderTiddler("text/html","test-tabs-macro-01")).toBe(expected.fields.text.replace(/\n/g,""));
	});

});

})();
