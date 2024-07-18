/*\
title: test-tags-operator.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the tagging mechanism.

\*/
/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

describe("Tags Operator tests", function() {

describe("With no indexers", function() {
	var wikiOptions = {enableIndexers: []},
		wiki = setupWiki(wikiOptions);
	runTests(wiki,wikiOptions);
});

describe("With all indexers", function() {
	var wikiOptions = {},
		wiki = setupWiki();
	runTests(wiki,wikiOptions);
});

function setupWiki(wikiOptions) {
	// Create a wiki
	var wiki = new $tw.Wiki(wikiOptions);

	// Add a few  tiddlers
	wiki.addTiddler({ title: "aaa",text: "text aaa",color: "red"});
	wiki.addTiddler({ title: "1"});
	wiki.addTiddler({ title: "10"});
	wiki.addTiddler({ title: "bbb"});
	wiki.addTiddler({ title: "bb bb"});
	wiki.addTiddler({ title: "BBB"});
	wiki.addTiddler({ title: "AAA"});
	wiki.addTiddler({ title: "BB BB"});
	wiki.addTiddler({ title: "bb bb", text: "text bb bb"});
	return wiki;
}

	// Our tests
function runTests(wiki,wikiOptions) {

	var TAGS = "aaa 10 1 bbb AAA [[bb bb]] BBB [[BB BB]]";

	// Tests before PR #8228 to make sure there are now incompatibilities
	it("should apply tags ordering in SORT order up to TW v5.3.6", function () {
		var wiki = new $tw.Wiki(wikiOptions);
		var EXPECTED = "1,10,aaa,AAA,bb bb,BB BB,bbb,BBB";

		wiki.addTiddler({ title: "test-tags-operator", text: "", tags: TAGS});
		expect(wiki.filterTiddlers("[[test-tags-operator]tags[]sort[title]]").join(',')).toBe(EXPECTED);

		wiki.addTiddler({ title: "$:/config/Tags/CustomSort/subfilter", text: "[{!!title}]"});
		expect(wiki.filterTiddlers("[[test-tags-operator]tags[]] :sort:alphanumeric:caseinsensitive[subfilter{$:/config/Tags/CustomSort/subfilter}]").join(',')).toBe(EXPECTED);

		// Due to the implementation of the tags[] operator with v5.3.6 we can not guarantee the order that `[tags[]]` returns
	});

	// The following test can be enabled once the core allows us to do so.
	xit("should apply tags ordering in order of creation. TW v5.3.7+", function () {
		var wiki = new $tw.Wiki(wikiOptions);

		wiki.addTiddler({ title: "$:/config/Tags/CustomSort/subfilter", text: ""});
		wiki.addTiddler({ title: "test-tags-operator", text: "", tags: TAGS});

		var EXPECTED = "aaa,10,1,bbb,AAA,bb bb,BBB,BB BB"
		expect(wiki.filterTiddlers("[[test-tags-operator]tags[]] :sort:alphanumeric:caseinsensitive[subfilter{$:/config/Tags/CustomSort/subfilter}]").join(',')).toBe(EXPECTED);
	});
}

});
