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
	// Replay each batch and measure refresh
	var results = [],
		totalRefreshTime = 0,
		totalFilterInvocations = 0;
	self.commander.streams.output.write("\nPerformance Timeline Replay\n");
	self.commander.streams.output.write("==========================\n");
	self.commander.streams.output.write("Wiki: " + tiddlerCount + " tiddlers\n");
	self.commander.streams.output.write("Timeline: " + timelineData.length + " operations in " + batches.length + " batches\n");
	self.commander.streams.output.write("Initial render: " + renderTime.toFixed(2) + "ms\n\n");
	self.commander.streams.output.write(padRight("Batch",8) + padRight("Ops",6) + padRight("Changed",10) +
		padRight("Refresh(ms)",14) + padRight("Filters",10) + "Tiddlers Changed\n");
	self.commander.streams.output.write(padRight("-----",8) + padRight("---",6) + padRight("-------",10) +
		padRight("-----------",14) + padRight("-------",10) + "----------------\n");
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
		self.commander.streams.output.write(
			padRight(String(index + 1),8) +
			padRight(String(batch.events.length),6) +
			padRight(String(changedTitles.length),10) +
			padRight(refreshTime.toFixed(2),14) +
			padRight(String(filterInvocations),10) +
			titlesDisplay + "\n"
		);
	});
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
			wiki: {tiddlerCount: tiddlerCount},
			timeline: {operations: timelineData.length, batches: batches.length},
			initialRender: renderTime,
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
