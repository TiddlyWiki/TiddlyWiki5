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

// This code can be copy pasted into the browser console for easy testing

	// the expected tiddlers can be found at ./data/tabs-macro/
	var expected     = $tw.wiki.getTiddler("expected-test-tabs-horizontal-a"),
		expectedAll  = $tw.wiki.getTiddler("expected-test-tabs-horizontal-all"),
		expectedVert = $tw.wiki.getTiddler("expected-test-tabs-vertical"),
		coreTabsTiddler = $tw.wiki.getTiddler("$:/core/macros/tabs");

	// Create a wiki with test tiddlers

	// Add a couple of tiddlers
	$tw.wiki.addTiddler(new $tw.Tiddler({title: "TabOne",   text: "Text tab 1", caption:"t 1"},$tw.wiki.getModificationFields()));
	$tw.wiki.addTiddler(new $tw.Tiddler({title: "TabTwo",   text: "Text tab 2", caption:"t 2"},$tw.wiki.getModificationFields()));
	// TabThree shows description used in button-template instead of caption
	$tw.wiki.addTiddler(new $tw.Tiddler({title: "TabThree", text: "Text tab 3", caption:"t 3", description:"desc"},$tw.wiki.getModificationFields()));
	// Tab Four has no caption field, so title will be used
	$tw.wiki.addTiddler(new $tw.Tiddler({title: "TabFour",  text: "Text tab 4"},$tw.wiki.getModificationFields()));

	// Template tiddlers
	$tw.wiki.addTiddler(new $tw.Tiddler({title: "body-template", "code-body":"yes",
						text: '!! <<currentTab>>\n\n<$transclude tiddler=<<currentTab>> mode="block"/>'},$tw.wiki.getModificationFields()));
	$tw.wiki.addTiddler(new $tw.Tiddler({title: "button-template", "code-body":"yes",
						text: '<$transclude tiddler=<<currentTab>> field="description"><$transclude tiddler=<<currentTab>> field="caption"><$macrocall $name="currentTab" $type="text/plain" $output="text/plain"/></$transclude></$transclude>'},$tw.wiki.getModificationFields()));
	// tabs macro cloned, to be used with \\import
	$tw.wiki.addTiddler(new $tw.Tiddler({title: "tabs-macro-definition", "code-body":"yes", text: coreTabsTiddler.fields.text},$tw.wiki.getModificationFields()));

	// horizontal tabs test uses `tabsList`, `default` and `state` -- unnamed params
	$tw.wiki.addTiddler(new $tw.Tiddler(
		{title: "test-tabs-horizontal",  text: '\\import [[tabs-macro-definition]]\n<<tabs "TabOne TabTwo TabThree TabFour" "TabTwo" "$:/state/test-tab-01">>'},
		$tw.wiki.getModificationFields())
	);

	// horizontal tabs test adds `template`, `buttonTemplate` and `explicitState` as named params
	$tw.wiki.addTiddler(new $tw.Tiddler(
		{title: "test-tabs-horizontal-all",  text: '\\import [[tabs-macro-definition]]\n<<tabs "TabOne TabTwo TabThree TabFour" "TabTwo" "$:/state/test-tab-01" template:"body-template" buttonTemplate:"button-template" explicitState:"$:/state/explicit">>'},
		$tw.wiki.getModificationFields())
	);

	// vertical tabs test. Same params as test 1
	$tw.wiki.addTiddler(new $tw.Tiddler(
		{title: "test-tabs-vertical",  text: '\\import [[tabs-macro-definition]]\n<<tabs "TabOne TabTwo TabThree TabFour" "TabTwo" "$:/state/test-tab-02" "tc-vertical">>'},
		$tw.wiki.getModificationFields())
	);

// End This code can be copy pasted into the browser console

	/* -----------------
	/ Run the tests
	--------------------*/
	// horizontal
	it("should render 'horizontal' tabs from v5.2.2 and up with whitespace trim", function() {
		expect($tw.wiki.renderTiddler("text/html","test-tabs-horizontal")).toBe(expected.fields.text.replace(/\n/g,""));
	});

	it("should render all 'horizontal' tabs from v5.2.2 and up with whitespace trim", function() {
		expect($tw.wiki.renderTiddler("text/html","test-tabs-horizontal-all")).toBe(expectedAll.fields.text.replace(/\n/g,""));
	});

	// vertical
	it("should render 'vertical' tabs from v5.2.2 and up with whitespace trim", function() {
		expect($tw.wiki.renderTiddler("text/html","test-tabs-vertical")).toBe(expectedVert.fields.text.replace(/\n/g,""));
	});
});

})();
