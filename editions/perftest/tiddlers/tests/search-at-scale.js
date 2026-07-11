/*\
title: $:/perf/tests/search-at-scale.js
type: application/javascript
tags: [[$:/tags/performance-test]]

Measures full-text search cost over a large tiddler set; the community's most-reported scale wall. Search is un-indexed: every query scans every tiddler's title, tags and text. The indexed-tag arm and its matched scan arm return the SAME set, so the pair shows the honest cost of an O(1) index lookup versus an O(n) scan for identical results.

\*/

"use strict";

exports.name = "search-at-scale";
exports.platform = "both";
exports.warmup = 2;
exports.iterations = 10;

var WORDS = ["detail","design","render","widget","filter","tiddler","project","status","report","archive","content","search","refresh","macro","transclude","paragraph"];

exports.run = function(context) {
	var wiki = context.wiki,
		count = 5000,
		prefix = "$:/temp/perftest/search/item-",
		measurements = [];
	seed(wiki,prefix,count);
	// Warm the tag index so the indexed row measures a lookup, not a first build
	wiki.filterTiddlers("[tag[perfitem-tagged]]");
	try {
		var battery = [
			{id: "search-broad", filter: "[all[tiddlers]search[e]]", note: "one-character query: scans every tiddler, matches most (early-keystroke worst case)"},
			{id: "search-word", filter: "[all[tiddlers]search[design]]", note: "specific common word: full scan, many matches (typical query)"},
			{id: "search-title-only", filter: "[all[tiddlers]search:title[item]]", note: "title-only search: scans titles, skips body"},
			{id: "lookup-indexed-tag", filter: "[tag[perfitem-tagged]]", note: "O(1) tag-index lookup returning the tagged tenth"},
			{id: "lookup-scan-same-set", filter: "[all[tiddlers]search[beacon]]", note: "O(n) scan returning the SAME tenth (only the tagged carry 'beacon'); the honest index-vs-scan pair"}
		];
		for(var i = 0; i < battery.length; i++) {
			measurements.push(measureFilter(context,count,battery[i]));
		}
	} finally{
		cleanup(wiki,prefix,count);
	}
	return measurements;
};

function measureFilter(context,count,spec) {
	var wiki = context.wiki,
		results = [];
	return context.measure(spec.id,function() {
		results = wiki.filterTiddlers(spec.filter);
		return {
			mode: "main",
			phase: "search",
			taxonomy: "search",
			scenarioId: spec.id,
			scenarioDescription: spec.note,
			fixtureName: "search-at-scale",
			fixtureItemCount: count,
			resultCount: results.length,
			filterString: spec.filter
		};
	});
}

function seed(wiki,prefix,count) {
	for(var i = 0; i < count; i++) {
		var body = [];
		for(var w = 0; w < 12; w++) {
			body.push(WORDS[(i + w * 7) % WORDS.length]);
		}
		// Every tenth tiddler carries a distinctive tag AND the rare word "beacon",
		// so a tag lookup and a scan for "beacon" return the identical set
		var fields = {
			title: prefix + i,
			text: "Item " + i + ": " + body.join(" ") + "."
		};
		if(i % 10 === 0) {
			fields.tags = ["perfitem-tagged"];
			fields.text += " beacon";
		}
		wiki.addTiddler(new $tw.Tiddler(fields));
	}
	wiki.clearTiddlerEventQueue();
}

function cleanup(wiki,prefix,count) {
	for(var i = 0; i < count; i++) {
		wiki.deleteTiddler(prefix + i);
	}
	wiki.clearTiddlerEventQueue();
}
