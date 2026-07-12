/*\
title: $:/plugins/tiddlywiki/performance/perf-compare-command.js
type: application/javascript
module-type: command

Command to compare two versions from replay results, cancelling the drift they share

Usage: --perf-compare <before-dir> <after-dir>

Each directory holds results files written by --perf-replay, acquired alternately in one session: before, after, before, after. The command pairs each before run with the after run beside it and works from the within pair difference, so the machine's drift lands inside the pair and cancels rather than accruing to whichever version ran second.

A difference whose confidence interval straddles zero reads INCONCLUSIVE, never a number dressed up as a win.

\*/

"use strict";

var stats = require("$:/plugins/tiddlywiki/performance/stats.js");

exports.info = {
	name: "perf-compare",
	synchronous: true
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
};

Command.prototype.execute = function() {
	var fs = require("fs"),
		path = require("path");
	if(this.params.length < 2) {
		return "Missing directories. Usage: --perf-compare <before-dir> <after-dir>";
	}
	var beforeRuns = loadRuns(fs,path,this.params[0]),
		afterRuns = loadRuns(fs,path,this.params[1]);
	if(beforeRuns.length < 2 || afterRuns.length < 2) {
		return "A paired comparison needs at least two runs of each version, acquired alternately in one session";
	}
	var out = this.commander.streams.output;
	out.write("\nPaired comparison (before -> after)\n");
	out.write("==================================\n");
	out.write("Pairs: " + Math.min(beforeRuns.length,afterRuns.length) + "\n");
	// Runs acquired as two blocks rather than alternately share no drift to cancel, so the pairing buys nothing and the reading cannot be trusted
	if(looksLikeSnapshot(beforeRuns,afterRuns)) {
		out.write("\n  ⚠ WARNING: these runs do not overlap in time, so one version ran entirely before the other.\n");
		out.write("    The drift between the two blocks stays uncancelled. Re-acquire them alternately in one session.\n");
	}
	var beforeTotals = beforeRuns.map(totalOf),
		afterTotals = afterRuns.map(totalOf),
		result = stats.comparePaired(beforeTotals,afterTotals);
	out.write("\nTotal refresh time\n");
	out.write("  before median: " + result.beforeMedian.toFixed(2) + "ms\n");
	out.write("  after median:  " + result.afterMedian.toFixed(2) + "ms\n");
	out.write("  difference:    " + signed(result.deltaMeanPct) + " (95% CI " + signed(result.ciLowPct) + " to " + signed(result.ciHighPct) + ")\n");
	out.write("  verdict:       " + verdictLine(result.verdict) + "\n");
	if(result.verdict === "inconclusive") {
		out.write("    The interval straddles zero, so these runs cannot tell this change from the machine.\n");
		out.write("    Raise repeats, add pairs, or quiet the machine. Do not read the difference as a result.\n");
	}
	return null;
};

function loadRuns(fs,path,dir) {
	var stat;
	try {
		stat = fs.statSync(dir);
	} catch(e) {
		return [];
	}
	if(!stat.isDirectory()) {
		return [];
	}
	return fs.readdirSync(dir)
		.filter(function(name) { return /\.json$/.test(name); })
		.sort()
		.map(function(name) {
			try {
				return JSON.parse(fs.readFileSync(path.resolve(dir,name),"utf8"));
			} catch(e) {
				return null;
			}
		})
		.filter(function(run) { return run && run.summary; });
}

function totalOf(run) {
	return run.summary.totalRefreshTime;
}

// Interleaved runs overlap in time; runs taken as two blocks do not
function looksLikeSnapshot(beforeRuns,afterRuns) {
	var beforeTimes = beforeRuns.map(timeOf).filter(isFinite),
		afterTimes = afterRuns.map(timeOf).filter(isFinite);
	if(beforeTimes.length === 0 || afterTimes.length === 0) {
		return false;
	}
	var beforeMax = Math.max.apply(null,beforeTimes),
		beforeMin = Math.min.apply(null,beforeTimes),
		afterMax = Math.max.apply(null,afterTimes),
		afterMin = Math.min.apply(null,afterTimes);
	return beforeMax < afterMin || afterMax < beforeMin;
}

function timeOf(run) {
	return run.timestamp ? Date.parse(run.timestamp) : NaN;
}

function signed(value) {
	return (value >= 0 ? "+" : "") + value.toFixed(1) + "%";
}

function verdictLine(verdict) {
	if(verdict === "inconclusive") {
		return "INCONCLUSIVE";
	}
	return verdict.toUpperCase();
}

exports.Command = Command;
