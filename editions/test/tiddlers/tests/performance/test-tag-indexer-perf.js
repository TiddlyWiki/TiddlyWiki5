/*\
title: test-tag-indexer-perf.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Performance benchmark for the TagIndexer (archived measurement code).

It measures the cost that an edit which does NOT change tags/list imposes on the
tag index. On master every such edit invalidates the index, so the next tag
lookup pays a full O(store) rebuild. The fix skips that invalidation.

Two metrics per store size:
- pureRebuild: cost of one forced index rebuild (the work we want to avoid)
- editLookup: cost of one (edit-text + tag-lookup) cycle as the UI does it

ARCHIVED FROM v5.5.0: this is informative measurement code, not a regression
guard. It runs on the 5.4.x line (where the fix landed) and auto-disables once
the core minor version bumps. See the convention in performance/readme.md.

Runs as part of the test edition (npm test); skipped in CI/CD.

\*/

"use strict";

describe("TagIndexer rebuild performance [benchmark]", function() {

	// Benchmarks are informative measurements, not regression guards, so we skip
	// them when their timings have no value. Two independent reasons:
	//   1. CI/CD: Netlify and GitHub Actions both set CI=true (Netlify also sets
	//      NETLIFY=true); TW_SKIP_PERF_TESTS forces a skip anywhere.
	//   2. Archived: once the core minor reaches ARCHIVED_FROM. checkVersions(a,b)
	//      is true when a >= b, so this holds from 5.5.0 on and is false for 5.4.x.
	// See performance/readme.md.
	var ARCHIVED_FROM = "5.5.0";
	var env = (typeof process !== "undefined" && process.env) || {};
	var skipReason = null;
	if(env.CI || env.NETLIFY || env.TW_SKIP_PERF_TESTS) {
		skipReason = "skipped in CI/CD";
	} else if($tw.utils.checkVersions($tw.version,ARCHIVED_FROM)) {
		skipReason = "archived from v" + ARCHIVED_FROM;
	}
	if(skipReason) {
		it("benchmark not run here (" + skipReason + ")",function() {
			pending(skipReason + "; running core is v" + $tw.version);
		});
		return;
	}

	// ~current, +20k, +40k
	var SIZES = [1000, 20000, 40000];
	// simulated keystroke+lookup cycles
	var EDIT_CYCLES = 50;
	// forced rebuilds to average
	var REBUILD_SAMPLES = 20;
	// the tag we repeatedly query
	var TAG = "BenchTag";
	// 1 in 50 tiddlers also carries TAG
	var TAG_EVERY = 50;
	// spread of other tags, so rebuild scans real data
	var DISTINCT_TAGS = 200;

	function buildWiki(size) {
		// indexers enabled by default
		var wiki = new $tw.Wiki();
		if(!wiki.getIndexer("TagIndexer")) {
			wiki.addIndexersToWiki();
		}
		for(var i=0; i<size; i++) {
			var tags = ["tag" + (i % DISTINCT_TAGS)];
			if(i % TAG_EVERY === 0) {
				tags.push(TAG);
			}
			var fields = {title: "t" + i, text: "body " + i, tags: tags};
			if(i % 7 === 0) {
				fields.list = "t" + ((i + 1) % size) + " t" + ((i + 2) % size);
			}
			wiki.addTiddler(fields);
		}
		return wiki;
	}

	function measure(size) {
		var wiki = buildWiki(size);
		var expectedCount = Math.ceil(size / TAG_EVERY);
		// subIndexers[3] is the one used by getTiddlersWithTag
		var sub = wiki.getIndexer("TagIndexer").subIndexers[3];

		// Sanity: index is active and correct
		expect(wiki.getTiddlersWithTag(TAG).length).toBe(expectedCount);

		// Metric 1: cost of a single forced rebuild
		// warm up
		wiki.getTiddlersWithTag(TAG);
		var r0 = $tw.utils.timer();
		for(var r=0; r<REBUILD_SAMPLES; r++) {
			// force the next lookup to rebuild
			sub.index = null;
			wiki.getTiddlersWithTag(TAG);
		}
		var pureRebuild = $tw.utils.timer(r0) / REBUILD_SAMPLES;

		// Metric 2: cost of an edit that does NOT touch tags/list + a lookup
		// t0 carries TAG; tags+list stay unchanged while typing
		var editTitle = "t0";
		var e0 = $tw.utils.timer();
		for(var k=0; k<EDIT_CYCLES; k++) {
			wiki.addTiddler(new $tw.Tiddler(wiki.getTiddler(editTitle), {text: "edit " + k}));
			wiki.getTiddlersWithTag(TAG);
		}
		var editLookup = $tw.utils.timer(e0) / EDIT_CYCLES;

		// Correctness is unchanged on both branches
		expect(wiki.getTiddlersWithTag(TAG).length).toBe(expectedCount);

		console.log(
			"[bench] size=" + pad(size, 6) +
			" tagMembers=" + pad(expectedCount, 5) +
			" pureRebuild=" + pad(pureRebuild.toFixed(3), 9) + "ms" +
			" editLookup=" + pad(editLookup.toFixed(3), 9) + "ms"
		);
	}

	function pad(value, width) {
		var s = "" + value;
		while(s.length < width) {
			s = " " + s;
		}
		return s;
	}

	SIZES.forEach(function(size) {
		it("measures rebuild vs edit cost at " + size + " tiddlers", function() {
			measure(size);
		});
	});

});
