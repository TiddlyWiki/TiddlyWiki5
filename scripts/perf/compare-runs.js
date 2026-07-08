#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

function usage() {
  console.log("Usage: node scripts/perf/compare-runs.js <results1.json> <results2.json> [resultsN.json] [--json <output.json>]");
}

function parseArgs(argv) {
  const files = [];
  let jsonOut = null;
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--json") {
      jsonOut = argv[i + 1];
      i += 1;
      continue;
    }
    files.push(arg);
  }
  return { files, jsonOut };
}

function readResult(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw);
  return {
    filePath,
    runName: path.basename(filePath),
    timestamp: parsed.environment && parsed.environment.timestamp,
    status: parsed.status,
    benchmarks: Array.isArray(parsed.benchmarks) ? parsed.benchmarks : []
  };
}

function isNum(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function medianOf(values) {
  if (values.length === 0) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function mean(values) {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stddev(values) {
  if (values.length === 0) return null;
  const m = mean(values);
  const variance = values.reduce((acc, value) => acc + Math.pow(value - m, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function pctDelta(a, b) {
  if (!isNum(a) || !isNum(b) || a === 0) return null;
  return ((b - a) / a) * 100;
}

function formatNumber(value, digits = 3) {
  return isNum(value) ? value.toFixed(digits) : "";
}

function formatPct(value, digits = 2) {
  return isNum(value) ? `${value.toFixed(digits)}%` : "";
}

function keyFor(row) {
  return [
    row.name || "",
    row.label || "",
    row.mode || "",
    row.phase || "",
    row.taxonomy || ""
  ].join("|");
}

function collectMeasurementRows(results) {
  const runs = [];
  const allKeys = new Set();

  for (const result of results) {
    const byKey = new Map();
    for (const row of result.benchmarks) {
      if (row.rowType !== "measurement") continue;
      if (row.error) continue;
      const key = keyFor(row);
      byKey.set(key, row);
      allKeys.add(key);
    }
    runs.push({
      runName: result.runName,
      timestamp: result.timestamp,
      status: result.status,
      byKey
    });
  }

  return { runs, keys: Array.from(allKeys).sort() };
}

function aggregateKeyStats(collected) {
  const stats = [];

  for (const key of collected.keys) {
    const [name, label, mode, phase, taxonomy] = key.split("|");
    const medians = [];
    const p95s = [];
    const p99s = [];
    const sds = [];
    let scenarioChangeRelation = null;
    let scenarioDescription = null;

    for (const run of collected.runs) {
      const row = run.byKey.get(key);
      medians.push(row && isNum(row.median) ? row.median : null);
      p95s.push(row && isNum(row.p95) ? row.p95 : null);
      p99s.push(row && isNum(row.p99) ? row.p99 : null);
      sds.push(row && isNum(row.standardDeviation) ? row.standardDeviation : null);
      if (row && !scenarioChangeRelation && row.scenarioChangeRelation) {
        scenarioChangeRelation = row.scenarioChangeRelation;
      }
      if (row && !scenarioDescription && row.scenarioDescription) {
        scenarioDescription = row.scenarioDescription;
      }
    }

    const medNum = medians.filter(isNum);
    const p95Num = p95s.filter(isNum);
    const p99Num = p99s.filter(isNum);
    const sdNum = sds.filter(isNum);

    const medianMean = mean(medNum);
    const medianMin = medNum.length ? Math.min(...medNum) : null;
    const medianMax = medNum.length ? Math.max(...medNum) : null;
    const medianSpreadPct = pctDelta(medianMin, medianMax);
    const medianCvPct = medianMean && isNum(stddev(medNum)) ? (stddev(medNum) / medianMean) * 100 : null;

    const p95Mean = mean(p95Num);
    const p95Min = p95Num.length ? Math.min(...p95Num) : null;
    const p95Max = p95Num.length ? Math.max(...p95Num) : null;
    const p95SpreadPct = pctDelta(p95Min, p95Max);
    const p95CvPct = p95Mean && isNum(stddev(p95Num)) ? (stddev(p95Num) / p95Mean) * 100 : null;

    const p99Mean = mean(p99Num);
    const p99Min = p99Num.length ? Math.min(...p99Num) : null;
    const p99Max = p99Num.length ? Math.max(...p99Num) : null;
    const p99SpreadPct = pctDelta(p99Min, p99Max);
    const p99CvPct = p99Mean && isNum(stddev(p99Num)) ? (stddev(p99Num) / p99Mean) * 100 : null;

    const firstMedian = medians.find(isNum);
    const lastMedian = [...medians].reverse().find(isNum);

    stats.push({
      key,
      name,
      label,
      mode,
      phase,
      taxonomy,
      medians,
      p95s,
      p99s,
      sds,
      scenarioChangeRelation,
      scenarioDescription,
      median: {
        mean: medianMean,
        min: medianMin,
        max: medianMax,
        spreadPct: medianSpreadPct,
        cvPct: medianCvPct,
        firstToLastPct: pctDelta(firstMedian, lastMedian)
      },
      p95: {
        mean: p95Mean,
        min: p95Min,
        max: p95Max,
        spreadPct: p95SpreadPct,
        cvPct: p95CvPct
      },
      p99: {
        mean: p99Mean,
        min: p99Min,
        max: p99Max,
        spreadPct: p99SpreadPct,
        cvPct: p99CvPct
      }
    });
  }

  return stats;
}

function computeModeEffects(collected) {
  const labels = new Set();
  for (const key of collected.keys) {
    const parts = key.split("|");
    if (parts[1]) labels.add(parts[1]);
  }

  const outputs = [];
  for (const label of Array.from(labels).sort()) {
    const yesVsNo = [];
    const yesVsUnset = [];

    for (const run of collected.runs) {
      const prefix = `resilient-render-widget-tree|${label}|`;
      const rowNo = run.byKey.get(`${prefix}no|refresh|refresh`) || run.byKey.get(`${prefix}no|render|render`);
      const rowYes = run.byKey.get(`${prefix}yes|refresh|refresh`) || run.byKey.get(`${prefix}yes|render|render`);
      const rowUnset = run.byKey.get(`${prefix}unset|refresh|refresh`) || run.byKey.get(`${prefix}unset|render|render`);

      const dYesNo = rowNo && rowYes ? pctDelta(rowNo.median, rowYes.median) : null;
      const dYesUnset = rowUnset && rowYes ? pctDelta(rowUnset.median, rowYes.median) : null;

      yesVsNo.push(dYesNo);
      yesVsUnset.push(dYesUnset);
    }

    const yesVsNoNum = yesVsNo.filter(isNum);
    const yesVsUnsetNum = yesVsUnset.filter(isNum);

    outputs.push({
      label,
      yesVsNo: {
        values: yesVsNo,
        medianPct: medianOf(yesVsNoNum),
        meanPct: mean(yesVsNoNum),
        minPct: yesVsNoNum.length ? Math.min(...yesVsNoNum) : null,
        maxPct: yesVsNoNum.length ? Math.max(...yesVsNoNum) : null
      },
      yesVsUnset: {
        values: yesVsUnset,
        medianPct: medianOf(yesVsUnsetNum),
        meanPct: mean(yesVsUnsetNum),
        minPct: yesVsUnsetNum.length ? Math.min(...yesVsUnsetNum) : null,
        maxPct: yesVsUnsetNum.length ? Math.max(...yesVsUnsetNum) : null
      }
    });
  }

  return outputs;
}

function printSummary(collected, keyStats, modeEffects) {
  console.log("=== Run Set ===");
  for (const run of collected.runs) {
    console.log(`${run.runName}\t${run.status}\t${run.timestamp || ""}`);
  }
  console.log("");

  console.log("=== Most Unstable By p99 Spread ===");
  const byP99 = keyStats
    .filter((row) => isNum(row.p99.spreadPct))
    .sort((a, b) => b.p99.spreadPct - a.p99.spreadPct)
    .slice(0, 10);

  for (const row of byP99) {
    console.log([
      row.name,
      row.label,
      row.mode,
      row.phase,
      row.scenarioChangeRelation || "",
      formatPct(row.p99.spreadPct),
      formatPct(row.p99.cvPct),
      formatNumber(row.p99.min),
      formatNumber(row.p99.max)
    ].join("\t"));
  }
  console.log("");

  console.log("=== Most Unstable By p95 Spread ===");
  const byP95 = keyStats
    .filter((row) => isNum(row.p95.spreadPct))
    .sort((a, b) => b.p95.spreadPct - a.p95.spreadPct)
    .slice(0, 10);

  for (const row of byP95) {
    console.log([
      row.name,
      row.label,
      row.mode,
      row.phase,
      formatPct(row.p95.spreadPct),
      formatPct(row.p95.cvPct),
      formatNumber(row.p95.min),
      formatNumber(row.p95.max)
    ].join("\t"));
  }
  console.log("");

  console.log("=== Most Unstable By Median Spread ===");
  const byMedian = keyStats
    .filter((row) => isNum(row.median.spreadPct))
    .sort((a, b) => b.median.spreadPct - a.median.spreadPct)
    .slice(0, 10);

  for (const row of byMedian) {
    console.log([
      row.name,
      row.label,
      row.mode,
      row.phase,
      row.scenarioChangeRelation || "",
      formatPct(row.median.spreadPct),
      formatPct(row.median.cvPct),
      formatPct(row.median.firstToLastPct),
      formatNumber(row.median.min),
      formatNumber(row.median.max)
    ].join("\t"));
  }
  console.log("");

  console.log("=== Mode Effects (median deltas across runs) ===");
  for (const row of modeEffects) {
    console.log([
      row.label,
      "yes-vs-no",
      formatPct(row.yesVsNo.medianPct),
      formatPct(row.yesVsNo.minPct),
      formatPct(row.yesVsNo.maxPct),
      "yes-vs-unset",
      formatPct(row.yesVsUnset.medianPct),
      formatPct(row.yesVsUnset.minPct),
      formatPct(row.yesVsUnset.maxPct)
    ].join("\t"));
  }
}

function main() {
  const { files, jsonOut } = parseArgs(process.argv);
  if (files.length < 2) {
    usage();
    process.exit(1);
  }

  const results = files.map(readResult);
  const collected = collectMeasurementRows(results);
  const keyStats = aggregateKeyStats(collected);
  const modeEffects = computeModeEffects(collected);

  printSummary(collected, keyStats, modeEffects);

  if (jsonOut) {
    const payload = {
      generatedAt: new Date().toISOString(),
      runs: collected.runs.map((run) => ({
        runName: run.runName,
        status: run.status,
        timestamp: run.timestamp
      })),
      keyStats,
      modeEffects
    };
    fs.writeFileSync(jsonOut, JSON.stringify(payload, null, 2), "utf8");
  }
}

main();
