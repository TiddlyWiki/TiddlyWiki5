/*\
title: test-wikitext-tabs-macro.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the core tabs macro by comparing the HTML output with a stored template.
Intended to permit future readability improvements.

Adding new functionality will probably change the "expected" html structure.

\*/

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

	// Test for invalid state fallback (issue #6548)
	// Uses explicitState so we can control the state tiddler directly
	$tw.wiki.addTiddler(new $tw.Tiddler(
		{title: "test-tabs-invalid-state", text: '\\import [[tabs-macro-definition]]\n<<tabs "TabOne TabTwo TabThree TabFour" "TabTwo" "$:/state/test-tab-01" explicitState:"$:/state/test-tab-invalid">>'},
		$tw.wiki.getModificationFields())
	);
	// Set the state tiddler to a value that doesn't match any tab
	$tw.wiki.addTiddler(new $tw.Tiddler({title: "$:/state/test-tab-invalid", text: "NonExistentTab"},$tw.wiki.getModificationFields()));

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

	// invalid state fallback (issue #6548)
	it("should fall back to default tab when state tiddler contains an invalid value", function() {
		var html = $tw.wiki.renderTiddler("text/html","test-tabs-invalid-state");
		// TabTwo is the default - its button should be selected (validValues on button widget)
		expect(html).toContain('aria-selected="true" class=" tc-tab-selected" data-tab-title="TabTwo"');
		// Other buttons should NOT be selected
		expect(html).toContain('aria-selected="false" class="" data-tab-title="TabOne"');
		expect(html).toContain('aria-selected="false" class="" data-tab-title="TabThree"');
		expect(html).toContain('aria-selected="false" class="" data-tab-title="TabFour"');
		// TabTwo content should be visible (validValues on reveal widget)
		expect(html).toContain('<div class="tc-reveal"><p>Text tab 2</p></div>');
		// The invalid tab (NonExistentTab) should not appear in the output
		expect(html).not.toContain("NonExistentTab");
	});
});

