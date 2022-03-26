/*\
title: test-wikitext-tabs-macro.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the core tabs macro by comparing the HTML output with a stored template.
Intended to permit future readability improvements.

Adding new functionality will probably change the "expected" html structure.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

describe("Tabs-macro HTML tests", function() {

	var expected     = $tw.wiki.getTiddler("expected-html-tabs-horizontal"),
		expectedAll  = $tw.wiki.getTiddler("expected-html-tabs-horizontal-all"),
		expectedVert = $tw.wiki.getTiddler("expected-html-tabs-vertical"),
		coreTabsTiddler = $tw.wiki.getTiddler("$:/core/macros/tabs");

	// Create a wiki
	var wiki = new $tw.Wiki();

	// Add a couple of tiddlers
	wiki.addTiddler({title: "TabOne",   text: "Text tab 1", caption:"t 1"});
	wiki.addTiddler({title: "TabTwo",   text: "Text tab 2", caption:"t 2"});
	// TabThree shows description used in button-template instead of caption
	wiki.addTiddler({title: "TabThree", text: "Text tab 3", caption:"t 3", description:"desc"});
	// Tab Four has no caption field, so title will be used
	wiki.addTiddler({title: "TabFour",  text: "Text tab 4"}); 

	// Template tiddlers
	wiki.addTiddler({	title: "body-template",
						text: '!! <<currentTab>>\n\n<$transclude tiddler=<<currentTab>> mode="block"/>'});
	wiki.addTiddler({	title: "button-template",
						text: '<$transclude tiddler=<<currentTab>> field="description"><$transclude tiddler=<<currentTab>> field="caption"><$macrocall $name="currentTab" $type="text/plain" $output="text/plain"/></$transclude></$transclude>'});
	// tabs macro cloned, to be used with \\import
	wiki.addTiddler({title: "tabs-macro-definition",  text: coreTabsTiddler.fields.text});

	// horizontal tabs test uses `tabsList`, `default` and `state` -- unnamed params
	wiki.addTiddler({title: "test-tabs-macro-horizontal",  text: '\\import [[tabs-macro-definition]]\n<<tabs "TabOne TabTwo TabThree TabFour" "TabTwo" "$:/state/test-tab-01">>'});

	// horizontal tabs test adds `template`, `buttonTemplate` and `explicitState` as named params
	wiki.addTiddler({title: "test-tabs-macro-horizontal-all",  text: '\\import [[tabs-macro-definition]]\n<<tabs "TabOne TabTwo TabThree TabFour" "TabTwo" "$:/state/test-tab-01" template:"body-template" buttonTemplate:"button-template" explicitState:"$:/state/explicit">>'});

	// vertical tabs test. Same params as test 1
	wiki.addTiddler({title: "test-tabs-macro-vertical",  text: '\\import [[tabs-macro-definition]]\n<<tabs "TabOne TabTwo TabThree TabFour" "TabTwo" "$:/state/test-tab-02" "tc-vertical">>'});

	/* -----------------
	/ Run the tests
	--------------------*/
	// horizontal
	it("should render horizontal tabs v5.2.1", function() {
		expect(wiki.renderTiddler("text/html","test-tabs-macro-horizontal")).toBe(expected.fields.text);
	});

	it("should render horizontal tabs macro with all parameters modified V5.2.1", function() {
		expect(wiki.renderTiddler("text/html","test-tabs-macro-horizontal-all")).toBe(expectedAll.fields.text);
	});

	// vertical
	it("should render tabs vertical tabs v5.2.1", function() {
		expect(wiki.renderTiddler("text/html","test-tabs-macro-vertical")).toBe(expectedVert.fields.text);
	});

	// Future tests
	// horizontal
	xit("should render 'horizontal' tabs from v5.2.2 and up with whitespace trim", function() {
		expect(wiki.renderTiddler("text/html","test-tabs-macro-horizontal")).toBe(expected.fields.text.replace(/\n/g,""));
	});

	xit("should render 'horizontal' tabs from v5.2.2 and up with whitespace trim", function() {
		expect(wiki.renderTiddler("text/html","test-tabs-macro-horizontal-all")).toBe(expectedAll.fields.text.replace(/\n/g,""));
	});

	// vertical
	xit("should render 'vertical' tabs from v5.2.2 and up with whitespace trim", function() {
		expect(wiki.renderTiddler("text/html","test-tabs-macro-vertical")).toBe(expectedVert.fields.text.replace(/\n/g,""));
	});
});

})();
