/*\
title: $:/perf/tests/filter-engine-scan.js
type: application/javascript
tags: [[$:/tags/performance-test]]

Measures the filter engine directly (via wiki.filterTiddlers, no widgets or DOM) over a large tiddler set, across a graded battery from an indexed tag hit to an un-indexed search scan to a per-title sub-filter.

\*/

"use strict";

exports.name = "filter-engine-scan";
exports.platform = "both";
exports.warmup = 2;
exports.iterations = 12;

var WORDS = ["alpha","beta","details","gamma","task","delta","report","epsilon","project","status"];

exports.run = function(context) {
	var wiki = context.wiki,
		count = 2000,
		prefix = "$:/temp/perftest/filter/item-",
		measurements = [];
	seed(wiki,prefix,count);
	// Warm the tag index so the indexed-hit row measures a lookup, not a first build
	wiki.filterTiddlers("[tag[perfitem-project-a]]");
	try {
		var battery = [
			{id: "filter-tag-indexed", filter: "[tag[perfitem-project-a]]", note: "indexed tag lookup, first in run (the fast path)"},
			{id: "filter-search-scan", filter: "[all[tiddlers]search[details]]", note: "un-indexed regexp scan over every tiddler (cache-proof; the honest headline)"},
			{id: "filter-heavy-chain", filter: "[tag[perfitem-project-a]!tag[perfitem-archived]search[task]sort[priority]limit[200]]", note: "index hit, then scan, then scan, then sort"},
			{id: "filter-sortsub-worst", filter: "[tag[perfitem-project-a]sortsub:number{[get[priority]]}]", note: "per-title sub-filter recompute (worst common operator)"}
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
			phase: "filter",
			taxonomy: "filter-engine",
			scenarioId: spec.id,
			scenarioDescription: spec.note,
			fixtureName: "filter-engine-scan",
			fixtureItemCount: count,
			resultCount: results.length,
			filterString: spec.filter
		};
	});
}

function seed(wiki,prefix,count) {
	for(var i = 0; i < count; i++) {
		var tags = [i % 2 ? "perfitem-project-a" : "perfitem-project-b",i % 3 ? "perfitem-status-open" : "perfitem-status-closed"];
		if(i % 11 === 0) {
			tags.push("perfitem-archived");
		}
		wiki.addTiddler(new $tw.Tiddler({
			title: prefix + i,
			tags: tags,
			priority: "" + (i % 100),
			text: "Item " + i + " " + WORDS[i % WORDS.length] + " " + WORDS[(i * 3) % WORDS.length] + " content for the " + (i % 2 ? "task" : "details") + " list."
		}));
	}
	wiki.clearTiddlerEventQueue();
}

function cleanup(wiki,prefix,count) {
	for(var i = 0; i < count; i++) {
		wiki.deleteTiddler(prefix + i);
	}
	wiki.clearTiddlerEventQueue();
}
