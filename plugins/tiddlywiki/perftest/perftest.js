/*\
title: $:/plugins/tiddlywiki/perftest/perftest.js
type: application/javascript
module-type: library

Performance test discovery, execution and reporting.

\*/
"use strict";

var DEFAULT_TEST_FILTER = "[all[tiddlers+shadows]type[application/javascript]tag[$:/tags/performance-test]]";
var TEST_FILTER_CONFIG_TITLE = "$:/config/Performance/TestFilter";
var DEFAULT_WARMUP = 5;
var DEFAULT_ITERATIONS = 50;
var DEFAULT_MEASUREMENT_BASELINE_ITERATIONS = 20;

function now() {
	if($tw.browser && window.performance && window.performance.now) {
		return window.performance.now();
	}
	if(typeof process !== "undefined" && process.hrtime) {
		var time = process.hrtime();
		return (time[0] * 1000) + (time[1] / 1000000);
	}
	return Date.now();
}

function loadBenchmark(title) {
	var code = $tw.wiki.getTiddlerText(title,""),
		_exports = {},
		context = {
			$tw: $tw,
			exports: _exports,
			module: {exports: _exports},
			console: console,
			require: function(moduleTitle) {
				return $tw.modules.execute(moduleTitle,title);
			}
		},
		contextExports = $tw.utils.evalSandboxed(code,context,title,true);
	return context.module.exports || contextExports || _exports;
}

function normalizePlatform(platform) {
	return platform || "both";
}

function platformMatches(platform,runtime) {
	platform = normalizePlatform(platform);
	return platform === "both" || platform === runtime;
}

function parseCount(value,defaultValue) {
	var parsed = parseInt(value,10);
	return isNaN(parsed) ? defaultValue : parsed;
}

function sanitizeNonNegativeCount(value,defaultValue) {
	var count = parseCount(value,defaultValue);
	return count < 0 ? defaultValue : count;
}

function calibrateMeasurementBaseline(iterations) {
	if(iterations <= 0) {
		return 0;
	}
	var samples = [];
	for(var i = 0; i < iterations; i++) {
		var before = now();
		var after = now();
		samples.push(after - before);
	}
	return percentile(samples.sort(function(a,b) {return a - b;}),0.5) || 0;
}

function makeContext(options) {
	var documentObject = $tw.browser ? document : $tw.fakeDocument;
	var measurementBaselineIterations = sanitizeNonNegativeCount(options.measurementBaselineIterations,DEFAULT_MEASUREMENT_BASELINE_ITERATIONS);
	var measurementBaselineMs = calibrateMeasurementBaseline(measurementBaselineIterations);
	var skipMeasurementDuringWarmup = options.skipMeasurementDuringWarmup !== false;
	var context = {
		wiki: $tw.wiki,
		document: documentObject,
		performance: {now: now},
		runtime: options.runtime,
		isWarmup: false,
		measurementBaselineIterations: measurementBaselineIterations,
		measurementBaselineMs: measurementBaselineMs,
		skipMeasurementDuringWarmup: skipMeasurementDuringWarmup,
		countDomNodes: countDomNodes,
		renderText: function(text) {
			var parser = $tw.wiki.parseText("text/vnd.tiddlywiki",text),
				widgetNode = $tw.wiki.makeWidget(parser,{document: documentObject}),
				wrapper = documentObject.createElement("div");
			widgetNode.render(wrapper,null);
			return {widgetNode: widgetNode, wrapper: wrapper};
		},
		refresh: function(widgetNode,changes,wrapper) {
			return widgetNode.refresh(changes,wrapper,null);
		},
		measure: function(label,fn,metadata) {
			var result,
				before,
				after,
				durationMs;
			if(context.isWarmup && context.skipMeasurementDuringWarmup) {
				result = fn();
				durationMs = 0;
			} else {
				before = now();
				result = fn();
				after = now();
				durationMs = Math.max(0,(after - before) - context.measurementBaselineMs);
			}
			return makeMeasurement(label,result,durationMs,metadata);
		},
		measureAsync: function(label,fn,metadata) {
			var before,
				durationMs;
			if(context.isWarmup && context.skipMeasurementDuringWarmup) {
				return Promise.resolve().then(fn).then(function(result) {
					return makeMeasurement(label,result,0,metadata);
				});
			}
			before = now();
			return Promise.resolve().then(fn).then(function(result) {
				durationMs = Math.max(0,(now() - before) - context.measurementBaselineMs);
				return makeMeasurement(label,result,durationMs,metadata);
			});
		}
	};
	return context;
}

function makeMeasurement(label,result,durationMs,metadata) {
	var measurement = {
		label: label,
		durationMs: durationMs
	};
	if(metadata) {
		$tw.utils.extend(measurement,metadata);
	}
	if(result && typeof result === "object") {
		$tw.utils.extend(measurement,result);
		measurement.label = label;
		if(measurement.durationMs === undefined) {
			measurement.durationMs = durationMs;
		}
	}
	return measurement;
}

function countDomNodes(node) {
	var count = 0;
	function walk(domNode) {
		count++;
		if(domNode.childNodes) {
			for(var i = 0; i < domNode.childNodes.length; i++) {
				walk(domNode.childNodes[i]);
			}
		}
	}
	if(node) {
		walk(node);
	}
	return count;
}

function normalizeMeasurements(result) {
	if(result === undefined || result === null) {
		return [];
	}
	if($tw.utils.isArray(result)) {
		return result;
	}
	return [result];
}

function percentile(sorted,rank) {
	if(sorted.length === 0) {
		return null;
	}
	return sorted[Math.max(0,Math.min(sorted.length - 1,Math.ceil(sorted.length * rank) - 1))];
}

function standardDeviation(values,mean) {
	if(values.length === 0) {
		return null;
	}
	var total = 0;
	for(var i = 0; i < values.length; i++) {
		total += Math.pow(values[i] - mean,2);
	}
	return Math.sqrt(total / values.length);
}

// Above this relative uncertainty a row reports as NOISY: it cannot support a claim of difference smaller than its own noise
var RESOLVABLE_EFFECT_THRESHOLD_PCT = 5;

function makeSummary(values) {
	var sorted = values.slice(0).sort(function(a,b) {return a - b;}),
		total = 0;
	for(var i = 0; i < sorted.length; i++) {
		total += sorted[i];
	}
	var n = sorted.length,
		mean = n ? total / n : null,
		median = percentile(sorted,0.5),
		sd = mean === null ? null : standardDeviation(values,mean),
		// Spread relative to the mean
		cvPct = (mean && sd !== null && mean > 0) ? (sd / mean) * 100 : null,
		// Relative standard error of the median: the smallest effect this row can resolve, its own noise floor
		resolvableEffectPct = (median && sd !== null && n > 0 && median > 0) ? (1.2533 * sd / Math.sqrt(n)) / median * 100 : null,
		trust = resolvableEffectPct === null ? "unknown" : (resolvableEffectPct <= RESOLVABLE_EFFECT_THRESHOLD_PCT ? "stable" : "noisy");
	return {
		samples: values,
		sampleCount: n,
		median: median,
		p75: percentile(sorted,0.75),
		p90: percentile(sorted,0.9),
		p95: percentile(sorted,0.95),
		p99: percentile(sorted,0.99),
		min: n ? sorted[0] : null,
		max: n ? sorted[sorted.length - 1] : null,
		mean: mean,
		standardDeviation: sd,
		cvPct: cvPct,
		resolvableEffectPct: resolvableEffectPct,
		trust: trust
	};
}

function mergeMeasurementMetadata(measurements) {
	var metadata = Object.create(null);
	$tw.utils.each(measurements,function(measurement) {
		for(var name in measurement) {
			if(name !== "durationMs" && name !== "label" && metadata[name] === undefined) {
				metadata[name] = measurement[name];
			}
		}
	});
	return metadata;
}

function getMeasurementKey(measurement,name) {
	return [
		measurement.label || name,
		measurement.phase || "",
		measurement.mode || "",
		measurement.taxonomy || ""
	].join("\u0000");
}

function getPhaseKey(row) {
	return [
		row.title || "",
		row.name || "",
		row.phase || "",
		row.mode || "",
		row.taxonomy || ""
	].join("\u0000");
}

function makePhaseRows(rows) {
	var rowsByPhase = Object.create(null),
		phaseRows = [];
	$tw.utils.each(rows,function(row) {
		if(!row.phase || row.error) {
			return;
		}
		var key = getPhaseKey(row);
		if(!rowsByPhase[key]) {
			rowsByPhase[key] = [];
		}
		rowsByPhase[key].push(row);
	});
	for(var key in rowsByPhase) {
		var sourceRows = rowsByPhase[key],
			values = [];
		$tw.utils.each(sourceRows,function(row) {
			values.push.apply(values,row.samples || []);
		});
		phaseRows.push($tw.utils.extend({
			rowType: "phase",
			title: sourceRows[0].title,
			name: sourceRows[0].name,
			phase: sourceRows[0].phase,
			mode: sourceRows[0].mode,
			taxonomy: sourceRows[0].taxonomy,
			iterations: sourceRows[0].iterations,
			warmup: sourceRows[0].warmup,
			error: null
		},makeSummary(values)));
	}
	return phaseRows;
}

function makeErrorResults(error,options) {
	return {
		schemaVersion: 2,
		status: "failed",
		environment: makeEnvironment(options || {}),
		benchmarks: [],
		error: error && error.stack ? error.stack : String(error)
	};
}

function makeEnvironment(options) {
	var defaultWarmup = parseCount(options.defaultWarmup,DEFAULT_WARMUP),
		defaultIterations = parseCount(options.defaultIterations,DEFAULT_ITERATIONS);
	var environment = {
		schemaVersion: 2,
		defaultWarmup: defaultWarmup,
		defaultIterations: defaultIterations,
		runtime: options.runtime,
		twVersion: $tw.version,
		userAgent: $tw.browser ? navigator.userAgent : "node " + process.version,
		timestamp: (new Date()).toISOString(),
		command: options.command || null,
		measurementBaselineIterations: sanitizeNonNegativeCount(options.measurementBaselineIterations,DEFAULT_MEASUREMENT_BASELINE_ITERATIONS),
		skipMeasurementDuringWarmup: options.skipMeasurementDuringWarmup !== false,
		testFilter: options.testFilter || $tw.wiki.getTiddlerText(TEST_FILTER_CONFIG_TITLE,DEFAULT_TEST_FILTER),
		instrument: options.instrument === "yes"
	};
	if(typeof process !== "undefined") {
		environment.nodeVersion = process.version;
		environment.platform = process.platform;
		environment.arch = process.arch;
	}
	return environment;
}

function runBenchmarkIteration(benchmark,context) {
	try {
		return Promise.resolve(benchmark.run(context));
	} catch(error) {
		return Promise.reject(error);
	}
}

function runWarmup(benchmark,context,warmup) {
	context.isWarmup = true;
	var chain = Promise.resolve();
	for(var i = 0; i < warmup; i++) {
		chain = chain.then(function() {
			return runBenchmarkIteration(benchmark,context);
		});
	}
	return chain.then(function() {
		context.isWarmup = false;
	}).catch(function(error) {
		context.isWarmup = false;
		throw error;
	});
}

function runMeasured(benchmark,context,iterations,onMeasurement) {
	var chain = Promise.resolve();
	for(var i = 0; i < iterations; i++) {
		chain = chain.then(function() {
			return runBenchmarkIteration(benchmark,context).then(function(runResult) {
				$tw.utils.each(normalizeMeasurements(runResult),onMeasurement);
			});
		});
	}
	return chain;
}

function run(options) {
	options = options || {};
	var runtime = options.runtime || ($tw.browser ? "browser" : "node"),
		defaultWarmup = parseCount(options.defaultWarmup,DEFAULT_WARMUP),
		defaultIterations = parseCount(options.defaultIterations,DEFAULT_ITERATIONS),
		measurementBaselineIterations = sanitizeNonNegativeCount(options.measurementBaselineIterations,DEFAULT_MEASUREMENT_BASELINE_ITERATIONS),
		skipMeasurementDuringWarmup = options.skipMeasurementDuringWarmup !== false,
		testFilter = options.testFilter || $tw.wiki.getTiddlerText(TEST_FILTER_CONFIG_TITLE,DEFAULT_TEST_FILTER),
		titles = $tw.wiki.filterTiddlers(testFilter).sort(),
		context = makeContext({
			runtime: runtime,
			measurementBaselineIterations: measurementBaselineIterations,
			skipMeasurementDuringWarmup: skipMeasurementDuringWarmup
		}),
		results = {
			schemaVersion: 2,
			status: "passed",
			environment: makeEnvironment({
				runtime: runtime,
				command: options.command,
				defaultWarmup: defaultWarmup,
				defaultIterations: defaultIterations,
				measurementBaselineIterations: measurementBaselineIterations,
				skipMeasurementDuringWarmup: skipMeasurementDuringWarmup,
				testFilter: testFilter,
				instrument: options.instrument
			}),
			benchmarks: []
		},
		chain = Promise.resolve();
	// Enabling $tw.perf records time and invocations for core operations the fixtures drive, so the report can show internal work with counts that expose a mis-attributed hot spot
	var instrument = options.instrument === "yes" && !!$tw.perf;
	if(instrument) {
		$tw.perf.enabled = true;
		$tw.perf.measures = {};
	}
	$tw.utils.each(titles,function(title) {
		chain = chain.then(function() {
			var benchmark = loadBenchmark(title),
				platform = normalizePlatform(benchmark.platform),
				name = benchmark.name || title,
				warmup = parseCount(benchmark.warmup,defaultWarmup),
				iterations = parseCount(benchmark.iterations,defaultIterations),
				measurementsByLabel = Object.create(null);
			if(!platformMatches(platform,runtime)) {
				return;
			}
			if(typeof benchmark.run !== "function") {
				results.status = "failed";
				results.benchmarks.push({title: title, name: name, error: "Missing run function"});
				return;
			}
			return runWarmup(benchmark,context,warmup).then(function() {
				return runMeasured(benchmark,context,iterations,function(measurement) {
					var key = getMeasurementKey(measurement,name);
					if(!measurementsByLabel[key]) {
						measurementsByLabel[key] = [];
					}
					measurementsByLabel[key].push(measurement);
				});
			}).then(function() {
				var measurementRows = [];
				for(var label in measurementsByLabel) {
					var measurements = measurementsByLabel[label],
						summary = makeSummary(measurements.map(function(measurement) {
							return measurement.durationMs;
						})),
						metadata = mergeMeasurementMetadata(measurements),
						rowLabel = measurements[0].label || label;
					measurementRows.push($tw.utils.extend({
						rowType: "measurement",
						title: title,
						name: name,
						label: rowLabel,
						iterations: iterations,
						warmup: warmup,
						error: null
					},metadata,summary));
				}
				results.benchmarks.push.apply(results.benchmarks,measurementRows);
				results.benchmarks.push.apply(results.benchmarks,makePhaseRows(measurementRows));
			}).catch(function(error) {
				results.status = "failed";
				results.benchmarks.push({
					rowType: "measurement",
					title: title,
					name: name,
					iterations: iterations,
					warmup: warmup,
					error: error && error.stack ? error.stack : String(error)
				});
			});
		});
	});
	return chain.then(function() {
		if(titles.length === 0) {
			results.status = "failed";
			results.error = "No performance tests found";
		}
		if(instrument) {
			results.internalMeasures = captureInternalMeasures();
		}
		return results;
	});
}

// Snapshot $tw.perf as rows sorted by total time; invocation counts distinguish a heavy call from death by a thousand cuts
function captureInternalMeasures() {
	var measures = ($tw.perf && $tw.perf.measures) || {},
		rows = [];
	for(var name in measures) {
		rows.push({
			name: name,
			invocations: measures[name].invocations,
			totalMs: measures[name].time,
			avgMs: measures[name].invocations ? measures[name].time / measures[name].invocations : 0
		});
	}
	rows.sort(function(a,b) {return b.totalMs - a.totalMs;});
	return rows;
}

function reportToConsole(results) {
	var noisy = 0;
	console.log("Performance tests: " + results.status);
	console.log("  Runtime: " + results.environment.runtime + " · TiddlyWiki " + results.environment.twVersion + " · " + results.environment.defaultIterations + " iterations after " + results.environment.defaultWarmup + " warmup runs");
	console.log("  Honest reading: each row shows its median, spread (CV), and floor; the smallest change it can resolve. A row marked NOISY cannot support any claim below its floor: raise iterations or ignore differences that small.");
	console.log("  To compare two versions, never read one whole run against another; between-session drift dwarfs most real changes. Interleave the versions in one session and use compare-runs (paired).");
	$tw.utils.each(results.benchmarks,function(benchmark) {
		if(benchmark.error) {
			console.log("  " + benchmark.name + ": " + benchmark.error);
		} else {
			var mode = benchmark.mode ? " [" + benchmark.mode + "]" : "",
				taxonomy = benchmark.taxonomy ? " (" + benchmark.taxonomy + ")" : "",
				phase = benchmark.phase ? " phase:" + benchmark.phase : "",
				label = benchmark.rowType === "phase" ? "phase aggregate" : benchmark.label,
				petName = benchmark.petName ? " - " + benchmark.petName : "",
				cv = benchmark.cvPct !== null && benchmark.cvPct !== undefined ? ", CV " + benchmark.cvPct.toFixed(0) + "%" : "",
				floor = benchmark.resolvableEffectPct !== null && benchmark.resolvableEffectPct !== undefined ? ", floor ±" + benchmark.resolvableEffectPct.toFixed(1) + "%" : "",
				flag = benchmark.trust === "noisy" ? "  ⚠ NOISY" : "";
			if(benchmark.trust === "noisy") {
				noisy++;
			}
			console.log("  " + benchmark.name + " / " + label + mode + taxonomy + phase + petName + ": median " + benchmark.median.toFixed(3) + "ms (n=" + benchmark.sampleCount + cv + floor + ")" + flag);
		}
	});
	if(noisy > 0) {
		console.log("  " + noisy + " row(s) marked NOISY: their spread swamps small effects. Any comparison on those rows needs more iterations before a difference is believable.");
	}
	if(results.internalMeasures && results.internalMeasures.length) {
		console.log("  --- TiddlyWiki internal instrumentation ($tw.perf), by total time ---");
		console.log("    Invocations are the honest half: a big share on few calls is a heavy call; the same share over many calls is death by a thousand cuts.");
		$tw.utils.each(results.internalMeasures,function(m) {
			console.log("    " + m.totalMs.toFixed(2) + "ms total, " + m.invocations + " calls, " + m.avgMs.toFixed(4) + "ms/call  " + m.name);
		});
	}
}

function reportToDom(results) {
	var statusNode = document.createElement("div"),
		jsonNode = document.createElement("script");
	statusNode.className = "tw-perf-overall-result tw-perf-done " + (results.status === "passed" ? "tw-perf-passed" : "tw-perf-failed");
	statusNode.textContent = "Performance tests: " + results.status;
	jsonNode.id = "tw-perf-results";
	jsonNode.type = "application/json";
	jsonNode.textContent = JSON.stringify(results,null,2);
	document.body.appendChild(statusNode);
	document.body.appendChild(jsonNode);
	window.$twPerfTestResults = results;
}

function writeResults(results,outputPath,filename) {
	var fs = require("fs"),
		path = require("path"),
		filepath = path.resolve(outputPath,filename);
	$tw.utils.createFileDirectories(filepath);
	fs.writeFileSync(filepath,JSON.stringify(results,null,2),"utf8");
}

exports.run = run;
exports.reportToConsole = reportToConsole;
exports.reportToDom = reportToDom;
exports.writeResults = writeResults;
exports.makeErrorResults = makeErrorResults;
