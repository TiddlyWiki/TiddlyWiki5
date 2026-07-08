const { test, expect } = require("@playwright/test");
const {resolve} = require("path");

const indexPath = resolve(__dirname, "output", "perftest.html");
const crossPlatformIndexPath = indexPath.replace(/^\/+/, "");

test("performance tests complete", async ({ page }) => {
	const timeout = 1000 * 60;
	test.setTimeout(timeout);

	await page.goto(`file:///${crossPlatformIndexPath}`);

	await expect(page.locator(".tc-site-title")).toHaveText("TiddlyWiki5 Performance Tests");
	await expect(page.locator(".tw-perf-overall-result")).toBeVisible({timeout});
	await expect(page.locator(".tw-perf-overall-result.tw-perf-failed")).not.toBeVisible();
	await expect(page.locator(".tw-perf-overall-result.tw-perf-passed")).toBeVisible();

	const resultsText = await page.locator("#tw-perf-results").textContent();
	const results = JSON.parse(resultsText);
	const measurementRows = results.benchmarks.filter((benchmark) => benchmark.rowType === "measurement");
	const phaseRows = results.benchmarks.filter((benchmark) => benchmark.rowType === "phase");
	const labels = measurementRows.map((benchmark) => benchmark.label);
	const modes = measurementRows.map((benchmark) => benchmark.mode);
	const phases = phaseRows.map((benchmark) => benchmark.phase);
	expect(labels).toContain("initial-render");
	expect(labels).toContain("refresh-unrelated-change");
	expect(labels).toContain("refresh-relevant-change");
	expect(modes).toContain("unset");
	expect(modes).toContain("no");
	expect(modes).toContain("yes");
	expect(phases).toContain("render");
	expect(phases).toContain("refresh");
	expect(measurementRows[0].sampleCount).toBe(50);
	expect(measurementRows[0].p75).not.toBeNull();
	expect(measurementRows[0].p90).not.toBeNull();
	expect(measurementRows[0].p95).not.toBeNull();
	expect(measurementRows[0].standardDeviation).not.toBeNull();
});
