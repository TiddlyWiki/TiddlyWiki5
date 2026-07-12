/*\
title: $:/plugins/tiddlywiki/performance/perf-replay-command.js
type: application/javascript
module-type: command

Command to replay a recorded performance timeline against the current wiki

Usage: --perf-replay <timeline.json> [--no-coalesce]

Loads the wiki (use --load before this command), builds a widget tree
using fakeDocument, then replays the recorded store modifications
batch by batch, measuring refresh performance for each batch.

\*/

"use strict";

var stats = require("$:/plugins/tiddlywiki/performance/stats.js");

exports.info = {
	name: "perf-replay",
	synchronous: false
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	var self = this,
		fs = require("fs"),
		path = require("path"),
		wiki = this.commander.wiki,
		widget = require("$:/core/modules/widgets/widget.js");
	// Parse parameters
	if(this.params.length < 1) {
		return "Missing timeline filename. Usage: --perf-replay <timeline.json>";
	}
	var timelinePath = this.params[0];
	// Load timeline
	var timelineData;
	try {
		timelineData = JSON.parse(fs.readFileSync(timelinePath,"utf8"));
	} catch(e) {
		return "Error reading timeline file: " + e.message;
	}
	if(!Array.isArray(timelineData) || timelineData.length === 0) {
		return "Timeline file is empty or invalid";
	}
	// Count tiddlers in wiki
	var tiddlerCount = 0;
	wiki.each(function() { tiddlerCount++; });
	// Build a widget tree against fakeDocument (mirroring what render.js does in the browser)
	var PAGE_TEMPLATE_TITLE = "$:/core/ui/RootTemplate";
	// Create root widget
	var rootWidget = new widget.widget({
		type: "widget",
		children: []
	},{
		wiki: wiki,
		document: $tw.fakeDocument
	});
	// Enable performance instrumentation
	var perf = new $tw.Performance(true);
	// Wrap filter execution with perf measurement
	var origCompileFilter = wiki.compileFilter;
	var filterInvocations = 0;
	wiki.compileFilter = function(filterString) {
		var compiledFilter = origCompileFilter.call(wiki,filterString);
		return perf.measure("filter: " + filterString.substring(0,80),function(source,widget) {
			filterInvocations++;
			return compiledFilter.call(this,source,widget);
		});
	};
	// Re-initialise parsers so filters get wrapped
	wiki.clearCache(null);
	// Build and render the page widget tree
	var pageWidgetNode = wiki.makeTranscludeWidget(PAGE_TEMPLATE_TITLE,{
		document: $tw.fakeDocument,
		parentWidget: rootWidget,
		recursionMarker: "no"
	});
	var pageContainer = $tw.fakeDocument.createElement("div");
	var renderStart = $tw.utils.timer();
	pageWidgetNode.render(pageContainer,null);
	var renderTime = $tw.utils.timer(renderStart);
	// Link root widget
	rootWidget.domNodes = [pageContainer];
	rootWidget.children = [pageWidgetNode];
	// Group timeline events by batch
	var batches = [];
	var currentBatch = null;
	$tw.utils.each(timelineData,function(event) {
		if(!currentBatch || event.batch !== currentBatch.batchId) {
			currentBatch = {batchId: event.batch, events: []};
			batches.push(currentBatch);
		}
		currentBatch.events.push(event);
	});
	// A timeline replayed once gives one timing, which carries no way to tell a real change from the machine's drift, so it replays as many times as asked and reports the spread
	var repeats = 1;
	$tw.utils.each(this.params,function(param) {
		var match = /^repeats=(\d+)$/.exec(param);
		if(match) {
			repeats = Math.max(1,parseInt(match[1],10));
		}
	});
	// Restoring the wiki between repeats needs the state each touched tiddler started in
	var touchedTitles = [],
		originalTiddlers = Object.create(null);
	$tw.utils.each(timelineData,function(event) {
		if(touchedTitles.indexOf(event.title) === -1) {
			touchedTitles.push(event.title);
			originalTiddlers[event.title] = wiki.getTiddler(event.title);
		}
	});
	function restoreWiki() {
		$tw.utils.each(touchedTitles,function(title) {
			if(originalTiddlers[title]) {
				wiki.addTiddler(originalTiddlers[title]);
			} else {
				wiki.deleteTiddler(title);
			}
		});
		var restored = Object.create(null);
		$tw.utils.each(touchedTitles,function(title) {
			restored[title] = {modified: true};
		});
		pageWidgetNode.refresh(restored);
	}
	// Replay each batch and measure refresh
	var results = [],
		totalRefreshTime = 0,
		totalFilterInvocations = 0,
		repeatTotals = [],
		batchSamples = [];
	self.commander.streams.output.write("\nPerformance Timeline Replay\n");
	self.commander.streams.output.write("==========================\n");
	self.commander.streams.output.write("Wiki: " + tiddlerCount + " tiddlers\n");
	self.commander.streams.output.write("Timeline: " + timelineData.length + " operations in " + batches.length + " batches\n");
	self.commander.streams.output.write("Initial render: " + renderTime.toFixed(2) + "ms\n\n");
	self.commander.streams.output.write(padRight("Batch",8) + padRight("Ops",6) + padRight("Changed",10) +
		padRight("Refresh(ms)",14) + padRight("Filters",10) + "Tiddlers Changed\n");
	self.commander.streams.output.write(padRight("-----",8) + padRight("---",6) + padRight("-------",10) +
		padRight("-----------",14) + padRight("-------",10) + "----------------\n");
	for(var repeat = 0; repeat < repeats; repeat++) {
		var isFinalRepeat = repeat === repeats - 1,
			repeatTotal = 0;
		if(repeat > 0) {
			restoreWiki();
			results = [];
			totalRefreshTime = 0;
			totalFilterInvocations = 0;
		}
		$tw.utils.each(batches,function(batch,index) {
		// Apply all operations in this batch directly (bypassing the intercepted addTiddler
		// to avoid re-recording)
			var changedTiddlers = Object.create(null);
			$tw.utils.each(batch.events,function(event) {
				if(event.op === "add") {
					wiki.addTiddler(new $tw.Tiddler(event.fields));
					changedTiddlers[event.title] = {modified: true};
				} else if(event.op === "delete") {
					wiki.deleteTiddler(event.title);
					changedTiddlers[event.title] = {deleted: true};
				}
			});
			// Measure refresh
			filterInvocations = 0;
			var refreshStart = $tw.utils.timer();
			pageWidgetNode.refresh(changedTiddlers);
			var refreshTime = $tw.utils.timer(refreshStart);
			totalRefreshTime += refreshTime;
			totalFilterInvocations += filterInvocations;
			repeatTotal += refreshTime;
			batchSamples[index] = batchSamples[index] || [];
			batchSamples[index].push(refreshTime);
			var changedTitles = Object.keys(changedTiddlers);
			var titlesDisplay = changedTitles.slice(0,3).join(", ");
			if(changedTitles.length > 3) {
				titlesDisplay += " (+" + (changedTitles.length - 3) + " more)";
			}
			results.push({
				batch: index + 1,
				ops: batch.events.length,
				changed: changedTitles.length,
				refreshMs: refreshTime,
				filters: filterInvocations,
				tiddlers: changedTitles
			});
			if(isFinalRepeat) {
				self.commander.streams.output.write(
					padRight(String(index + 1),8) +
				padRight(String(batch.events.length),6) +
				padRight(String(changedTitles.length),10) +
				padRight(refreshTime.toFixed(2),14) +
				padRight(String(filterInvocations),10) +
				titlesDisplay + "\n"
				);
			}
		});
		repeatTotals.push(repeatTotal);
	}
	// Summary statistics
	var refreshTimes = results.map(function(r) { return r.refreshMs; }).sort(function(a,b) { return a - b; });
	var p50 = percentile(refreshTimes,50);
	var p95 = percentile(refreshTimes,95);
	var p99 = percentile(refreshTimes,99);
	var maxRefresh = refreshTimes[refreshTimes.length - 1] || 0;
	var meanRefresh = batches.length > 0 ? totalRefreshTime / batches.length : 0;
	self.commander.streams.output.write("\nSummary\n");
	self.commander.streams.output.write("-------\n");
	self.commander.streams.output.write("Initial render:      " + renderTime.toFixed(2) + "ms\n");
	self.commander.streams.output.write("Total refresh time:  " + totalRefreshTime.toFixed(2) + "ms\n");
	self.commander.streams.output.write("Mean refresh:        " + meanRefresh.toFixed(2) + "ms\n");
	self.commander.streams.output.write("P50 refresh:         " + p50.toFixed(2) + "ms\n");
	self.commander.streams.output.write("P95 refresh:         " + p95.toFixed(2) + "ms\n");
	self.commander.streams.output.write("P99 refresh:         " + p99.toFixed(2) + "ms\n");
	self.commander.streams.output.write("Max refresh:         " + maxRefresh.toFixed(2) + "ms\n");
	self.commander.streams.output.write("Total filters run:   " + totalFilterInvocations + "\n");
	// Report what this run can resolve, so a later comparison cannot claim more than the measurement supports
	var totalsSummary = stats.summarise(repeatTotals);
	self.commander.streams.output.write("\nReliability\n");
	self.commander.streams.output.write("-----------\n");
	self.commander.streams.output.write("Repeats:             " + repeats + "\n");
	if(repeats < 2) {
		self.commander.streams.output.write("Spread:              unknown, since one repeat cannot report its own reliability\n");
		self.commander.streams.output.write("  Pass repeats=5 or more to learn the smallest difference this timeline can resolve.\n");
	} else {
		self.commander.streams.output.write("Median total:        " + totalsSummary.median.toFixed(2) + "ms\n");
		self.commander.streams.output.write("Spread (CV):         " + totalsSummary.cvPct.toFixed(1) + "%\n");
		self.commander.streams.output.write("Resolvable effect:   " + (totalsSummary.resolvableEffectPct === Infinity ? "unknown" : "±" + totalsSummary.resolvableEffectPct.toFixed(1) + "%") + "\n");
		if(totalsSummary.trust === "noisy") {
			self.commander.streams.output.write("  ⚠ NOISY: this timeline cannot resolve a small change. Raise repeats, or quiet the machine.\n");
		}
	}
	self.commander.streams.output.write("\nA run compared against a run reports the machine as often as the code. To compare two versions,\n");
	self.commander.streams.output.write("acquire them alternately in one session and read them with --perf-compare, which cancels the drift they share.\n");
	// Output filter breakdown
	self.commander.streams.output.write("\nTop Filter Execution Times\n");
	self.commander.streams.output.write("--------------------------\n");
	var measures = perf.measures;
	var orderedMeasures = Object.keys(measures).sort(function(a,b) {
		return measures[b].time - measures[a].time;
	}).slice(0,20);
	$tw.utils.each(orderedMeasures,function(name) {
		var m = measures[name];
		self.commander.streams.output.write(
			padRight(m.time.toFixed(2) + "ms",14) +
			padRight(String(m.invocations) + "x",10) +
			padRight((m.time / m.invocations).toFixed(3) + "ms avg",16) +
			name + "\n"
		);
	});
	// Write JSON results
	var jsonResultPath = timelinePath.replace(/\.json$/,"") + "-results.json";
	try {
		fs.writeFileSync(jsonResultPath,JSON.stringify({
			timestamp: new Date().toISOString(),
			wiki: {tiddlerCount: tiddlerCount},
			timeline: {operations: timelineData.length, batches: batches.length},
			initialRender: renderTime,
			repeats: repeats,
			repeatTotals: repeatTotals,
			reliability: totalsSummary,
			batchSamples: batchSamples,
			summary: {
				totalRefreshTime: totalRefreshTime,
				meanRefresh: meanRefresh,
				p50: p50,
				p95: p95,
				p99: p99,
				maxRefresh: maxRefresh,
				totalFilterInvocations: totalFilterInvocations
			},
			batches: results,
			topFilters: orderedMeasures.map(function(name) {
				return {name: name, time: measures[name].time, invocations: measures[name].invocations};
			})
		},null,"\t"),"utf8");
		self.commander.streams.output.write("\nDetailed results written to: " + jsonResultPath + "\n");
	} catch(e) {
		self.commander.streams.output.write("\nWarning: Could not write results file: " + e.message + "\n");
	}
	self.callback(null);
	return null;
};

function percentile(sortedArray,p) {
	if(sortedArray.length === 0) return 0;
	var index = Math.ceil(sortedArray.length * p / 100) - 1;
	return sortedArray[Math.max(0,index)];
}

function padRight(str,width) {
	while(str.length < width) {
		str += " ";
	}
	return str;
}

exports.Command = Command;
