/*\
title: $:/plugins/tiddlywiki/performance/stats.js
type: application/javascript
module-type: library

Statistics for deciding whether a measured difference means anything.

A single timing carries no information about its own reliability. Machine load, thermal state and JIT warmth drift over minutes, and that drift routinely exceeds the effect a change produces, so a run compared against a run reports the weather as often as it reports the code. These functions report what a measurement can and cannot resolve, and refuse a verdict below that.

\*/

"use strict";

// Below this spread, a row still supports a claim; above it, the row reports its own weather
var NOISY_FLOOR_PCT = 5;

// The standard error of a median runs about a quarter wider than the standard error of a mean
var MEDIAN_SE_FACTOR = 1.2533;

exports.median = function(values) {
	if(values.length === 0) {
		return 0;
	}
	var sorted = values.slice().sort(function(a,b) { return a - b; }),
		middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

exports.mean = function(values) {
	if(values.length === 0) {
		return 0;
	}
	return values.reduce(function(sum,value) { return sum + value; },0) / values.length;
};

exports.standardDeviation = function(values) {
	if(values.length < 2) {
		return 0;
	}
	var mu = exports.mean(values);
	return Math.sqrt(values.reduce(function(sum,value) {
		return sum + (value - mu) * (value - mu);
	},0) / (values.length - 1));
};

/*
Spread relative to the typical value. A high figure says the timings scatter, whatever their average
*/
exports.coefficientOfVariationPct = function(values) {
	var mu = exports.mean(values);
	if(mu === 0) {
		return 0;
	}
	return exports.standardDeviation(values) / mu * 100;
};

/*
The smallest difference these samples can resolve. A claimed improvement below this figure reports noise
*/
exports.resolvableEffectPct = function(values) {
	var med = exports.median(values);
	if(values.length < 2 || med === 0) {
		return Infinity;
	}
	return MEDIAN_SE_FACTOR * exports.standardDeviation(values) / Math.sqrt(values.length) / med * 100;
};

exports.summarise = function(values) {
	var floor = exports.resolvableEffectPct(values);
	return {
		samples: values.length,
		median: exports.median(values),
		mean: exports.mean(values),
		cvPct: exports.coefficientOfVariationPct(values),
		resolvableEffectPct: floor,
		trust: floor > NOISY_FLOOR_PCT ? "noisy" : "ok"
	};
};

/*
Compare two versions from runs acquired in one session, alternating between them. Each before run pairs with the after run beside it, and the comparison works from the within pair difference, so the drift both runs share cancels rather than landing on whichever version ran second.

Returns a verdict of "improvement", "regression" or "inconclusive". The interval straddling zero earns "inconclusive", never a number dressed up as a win.
*/
exports.comparePaired = function(beforeValues,afterValues) {
	var pairs = Math.min(beforeValues.length,afterValues.length),
		deltas = [];
	for(var i = 0; i < pairs; i++) {
		if(beforeValues[i] > 0) {
			deltas.push((afterValues[i] - beforeValues[i]) / beforeValues[i] * 100);
		}
	}
	if(deltas.length < 2) {
		return {pairs: deltas.length, verdict: "inconclusive", reason: "a paired comparison needs at least two pairs"};
	}
	var deltaMean = exports.mean(deltas),
		halfWidth = 1.96 * exports.standardDeviation(deltas) / Math.sqrt(deltas.length),
		low = deltaMean - halfWidth,
		high = deltaMean + halfWidth,
		verdict;
	if(low > 0) {
		verdict = "regression";
	} else if(high < 0) {
		verdict = "improvement";
	} else {
		verdict = "inconclusive";
	}
	return {
		pairs: deltas.length,
		beforeMedian: exports.median(beforeValues),
		afterMedian: exports.median(afterValues),
		deltaMedianPct: exports.median(deltas),
		deltaMeanPct: deltaMean,
		ci95Pct: halfWidth,
		ciLowPct: low,
		ciHighPct: high,
		verdict: verdict
	};
};

exports.NOISY_FLOOR_PCT = NOISY_FLOOR_PCT;
