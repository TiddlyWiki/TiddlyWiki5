/*
Honest paired A/B comparison for TiddlyWiki perftest runs.

	node scripts/perf/compare-runs.js <before-dir> <after-dir> [--json out.json]

Each directory holds run-*.json files produced by `--perf`, acquired interleaved
(before, after, before, after, ...) in one session. The tool pairs before[i] with
after[i] and works from the within-pair delta, so between-session drift (machine
load, thermal state), which routinely exceeds the effect being hunted, cancels out.
Each delta is reported with a 95% confidence interval; a CI that straddles zero
reads INCONCLUSIVE, never a number dressed up as a win.
*/
"use strict";

const fs = require("fs");
const path = require("path");

function usage() {
	console.log("Usage: node scripts/perf/compare-runs.js <before-dir> <after-dir> [--json out.json]");
	console.log("  Directories hold run-*.json from --perf, acquired interleaved (before, after, before, after, ...).");
}

function loadRuns(dir) {
	return fs.readdirSync(dir)
		.filter((f) => /^run-\d+\.json$/.test(f))
		.sort((a, b) => parseInt(a.match(/\d+/)[0], 10) - parseInt(b.match(/\d+/)[0], 10))
		.map((f) => {
			const json = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
			const byKey = new Map();
			for(const row of json.benchmarks || []) {
				if(row.rowType === "measurement" && !row.error && typeof row.median === "number") {
					byKey.set(measurementKey(row), row.median);
				}
			}
			return { file: f, timestamp: json.environment && json.environment.timestamp, byKey };
		});
}

function measurementKey(row) {
	return [row.name || "", row.label || "", row.phase || "", row.mode || ""].join(" | ");
}

function median(values) {
	const a = values.slice().sort((x, y) => x - y);
	const m = Math.floor(a.length / 2);
	return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

function mean(values) {
	return values.reduce((s, x) => s + x, 0) / values.length;
}

function stddev(values, mu) {
	if(values.length < 2) return 0;
	return Math.sqrt(values.reduce((s, x) => s + (x - mu) * (x - mu), 0) / (values.length - 1));
}

// Warn when the two sets were acquired as snapshots (all before, then all after)
// rather than interleaved: snapshot pairs cannot cancel drift.
function looksInterleaved(before, after) {
	const bt = before.map((r) => r.timestamp).filter(Boolean).map((t) => Date.parse(t));
	const at = after.map((r) => r.timestamp).filter(Boolean).map((t) => Date.parse(t));
	if(bt.length === 0 || at.length === 0) return null;
	// Interleaved if the two time ranges overlap; snapshot if one set fully precedes the other.
	const beforeMax = Math.max(...bt), afterMin = Math.min(...at);
	const afterMax = Math.max(...at), beforeMin = Math.min(...bt);
	return !(beforeMax < afterMin || afterMax < beforeMin);
}

function compare(beforeDir, afterDir) {
	const before = loadRuns(beforeDir);
	const after = loadRuns(afterDir);
	const pairs = Math.min(before.length, after.length);
	if(pairs < 2) {
		throw new Error(`Need at least 2 paired runs in each directory; found ${before.length} before / ${after.length} after.`);
	}
	const keys = [...before[0].byKey.keys()].filter(
		(k) => before.every((r) => r.byKey.has(k)) && after.every((r) => r.byKey.has(k))
	).sort();
	const results = [];
	for(const key of keys) {
		const deltas = [];
		for(let i = 0; i < pairs; i++) {
			const b = before[i].byKey.get(key), a = after[i].byKey.get(key);
			if(b > 0) deltas.push((a - b) / b * 100);
		}
		if(deltas.length < 2) continue;
		const dMean = mean(deltas);
		const dMedian = median(deltas);
		const se = stddev(deltas, dMean) / Math.sqrt(deltas.length);
		const ci95 = 1.96 * se; // half-width of the 95% CI on the mean delta
		const lo = dMean - ci95, hi = dMean + ci95;
		let verdict;
		if(lo > 0) verdict = "regression";
		else if(hi < 0) verdict = "improvement";
		else verdict = "inconclusive"; // the CI straddles zero; the rig cannot resolve this
		results.push({
			key, pairs: deltas.length,
			beforeMedian: median(before.map((r) => r.byKey.get(key))),
			afterMedian: median(after.map((r) => r.byKey.get(key))),
			deltaMedianPct: dMedian, deltaMeanPct: dMean,
			ci95Pct: ci95, ciLoPct: lo, ciHiPct: hi,
			verdict
		});
	}
	return { pairs, interleaved: looksInterleaved(before, after), keys: results };
}

function fmtPct(x) {
	return (x >= 0 ? "+" : "") + x.toFixed(1) + "%";
}

function print(report) {
	console.log("=== Paired A/B (before -> after), drift-cancelled ===");
	console.log(`pairs=${report.pairs}  keys=${report.keys.length}`);
	if(report.interleaved === false) {
		console.log("  ⚠ WARNING: the two run sets do NOT overlap in time; they look like SNAPSHOTS, not interleaved.");
		console.log("    Between-session drift is uncancelled here; treat every delta below as unreliable. Re-acquire interleaved.");
	} else if(report.interleaved === null) {
		console.log("  (could not verify interleaving from timestamps)");
	}
	// The rig's own resolution: the median CI half-width across keys; the smallest effect it can call.
	const floor = report.keys.length ? median(report.keys.map((k) => k.ci95Pct)) : null;
	if(floor !== null) {
		console.log(`  Resolution floor (median 95% CI half-width): ±${floor.toFixed(1)}%. Deltas smaller than this are inconclusive by construction.`);
	}
	const counts = { improvement: 0, regression: 0, inconclusive: 0 };
	report.keys.forEach((k) => { counts[k.verdict]++; });
	console.log(`  Verdicts: ${counts.improvement} improvement, ${counts.regression} regression, ${counts.inconclusive} inconclusive`);
	console.log("");
	console.log("KEY\tbefore_ms\tafter_ms\tΔmedian\tΔmean\t95% CI\tverdict");
	report.keys
		.slice()
		.sort((a, b) => Math.abs(b.deltaMeanPct) - Math.abs(a.deltaMeanPct))
		.forEach((k) => {
			const tag = k.verdict === "inconclusive" ? "inconclusive" : k.verdict.toUpperCase();
			console.log(
				`${k.key}\t${k.beforeMedian.toFixed(3)}\t${k.afterMedian.toFixed(3)}\t` +
				`${fmtPct(k.deltaMedianPct)}\t${fmtPct(k.deltaMeanPct)}\t[${fmtPct(k.ciLoPct)}, ${fmtPct(k.ciHiPct)}]\t${tag}`
			);
		});
}

function main() {
	const args = process.argv.slice(2);
	let jsonOut = null;
	const positional = [];
	for(let i = 0; i < args.length; i++) {
		if(args[i] === "--json") { jsonOut = args[++i]; }
		else { positional.push(args[i]); }
	}
	if(positional.length < 2) { usage(); process.exit(1); }
	const report = compare(positional[0], positional[1]);
	print(report);
	if(jsonOut) {
		fs.writeFileSync(jsonOut, JSON.stringify(report, null, 2), "utf8");
	}
}

main();
