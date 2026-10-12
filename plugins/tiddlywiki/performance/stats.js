/*\
title: $:/plugins/tiddlywiki/performance/stats.js
type: application/javascript
module-type: library

Statistics for performance replay comparisons.

\*/

"use strict";

var NOISY_FLOOR_PCT = 5;

// Approximate median-to-mean standard error ratio for normal samples.
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

exports.coefficientOfVariationPct = function(values) {
	var mu = exports.mean(values);
	if(mu === 0) {
		return 0;
	}
	return exports.standardDeviation(values) / mu * 100;
};

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

// Before and after samples must be in matching acquisition order.
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
