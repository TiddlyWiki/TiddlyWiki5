/*\
title: $:/plugins/tiddlywiki/performance/recorder.js
type: application/javascript
module-type: startup

Store modification recorder for performance testing.
Intercepts wiki.addTiddler() and wiki.deleteTiddler() to capture
a timeline of all store modifications with batch boundary tracking.

\*/

"use strict";

exports.name = "perf-recorder";
exports.platforms = ["browser"];
exports.after = ["load-modules"];
exports.synchronous = true;

exports.startup = function() {
	var STATE_TIDDLER = "$:/state/performance/recording",
		TIMELINE_TIDDLER = "$:/temp/performance/timeline",
		COALESCE_CONFIG = "$:/config/performance/coalesce-drafts",
		timeline = [],
		seq = 0,
		startTime = null,
		recording = false,
		batchId = 0,
		currentBatch = 0,
		origNextTick = $tw.utils.nextTick,
		origAddTiddler = $tw.wiki.addTiddler.bind($tw.wiki),
		origDeleteTiddler = $tw.wiki.deleteTiddler.bind($tw.wiki);

	// Patch nextTick to track batch boundaries
	$tw.utils.nextTick = function(fn) {
		origNextTick(function() {
			if(recording) {
				currentBatch = ++batchId;
			}
			fn();
		});
	};

	// Patch addTiddler
	$tw.wiki.addTiddler = function(tiddler) {
		if(recording) {
			if(!(tiddler instanceof $tw.Tiddler)) {
				tiddler = new $tw.Tiddler(tiddler);
			}
			var title = tiddler.fields.title;
			// Skip our own state/timeline tiddlers
			if(title !== STATE_TIDDLER && title !== TIMELINE_TIDDLER) {
				timeline.push({
					seq: seq++,
					t: $tw.utils.timer(startTime),
					batch: currentBatch,
					op: "add",
					title: title,
					isDraft: tiddler.hasField("draft.of"),
					fields: tiddler.getFieldStrings()
				});
			}
		}
		return origAddTiddler.apply(null,arguments);
	};

	// Patch deleteTiddler
	$tw.wiki.deleteTiddler = function(title) {
		if(recording) {
			if(title !== STATE_TIDDLER && title !== TIMELINE_TIDDLER) {
				timeline.push({
					seq: seq++,
					t: $tw.utils.timer(startTime),
					batch: currentBatch,
					op: "delete",
					title: title,
					isDraft: false,
					fields: null
				});
			}
		}
		return origDeleteTiddler.apply(null,arguments);
	};

	// Listen for recording state changes
	$tw.wiki.addEventListener("change",function(changes) {
		if(STATE_TIDDLER in changes) {
			var state = $tw.wiki.getTiddlerText(STATE_TIDDLER,"").trim();
			if(state === "yes" && !recording) {
				// Start recording
				timeline = [];
				seq = 0;
				batchId = 0;
				currentBatch = 0;
				startTime = $tw.utils.timer();
				recording = true;
				console.log("performance: Recording started");
			} else if(state !== "yes" && recording) {
				// Stop recording and save timeline
				recording = false;
				var coalesce = $tw.wiki.getTiddlerText(COALESCE_CONFIG,"yes").trim() === "yes";
				var output = coalesce ? coalesceDrafts(timeline) : timeline;
				origAddTiddler(new $tw.Tiddler({
					title: TIMELINE_TIDDLER,
					type: "application/json",
					text: JSON.stringify(output,null,"\t")
				}));
				console.log("performance: Recording stopped. " + timeline.length + " operations captured" +
					(coalesce ? " (" + output.length + " after coalescing drafts)" : ""));
			}
		}
	});

	/*
	Coalesce rapid draft tiddler updates within the same batch.
	Keeps only the last update for each draft tiddler per batch.
	*/
	function coalesceDrafts(events) {
		var result = [],
			i = 0;
		while(i < events.length) {
			var event = events[i];
			if(event.isDraft && event.op === "add") {
				// Look ahead for later updates to this same draft in the same batch
				var lastIndex = i;
				for(var j = i + 1; j < events.length; j++) {
					if(events[j].batch !== event.batch) {
						break;
					}
					if(events[j].title === event.title && events[j].op === "add") {
						lastIndex = j;
					}
				}
				// Keep only the last one, but fix its seq to maintain ordering
				result.push(events[lastIndex]);
				i = lastIndex + 1;
			} else {
				result.push(event);
				i++;
			}
		}
		return result;
	}
};
