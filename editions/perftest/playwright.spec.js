const { test, expect } = require("@playwright/test");
const {resolve} = require("path");

const indexPath = resolve(__dirname, "output", "perftest.html");
const crossPlatformIndexPath = indexPath.replace(/^\/+/, "");

test("performance tests complete", async ({ page }, testInfo) => {
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
	const scenarioIds = measurementRows.map((benchmark) => benchmark.scenarioId);
	const phases = phaseRows.map((benchmark) => benchmark.phase);
	const draftGradient = measurementRows.find((benchmark) => benchmark.scenarioId === "draft-gradient-preview");
	expect(labels).toContain("initial-render");
	expect(labels).toContain("refresh-unrelated-change");
	expect(labels).toContain("refresh-relevant-change");
	expect(scenarioIds).toContain("parser-direct");
	expect(scenarioIds).toContain("parser-cached");
	expect(scenarioIds).toContain("parser-failure-recoverable");
	const recoverableParse = measurementRows.find((benchmark) => benchmark.scenarioId === "parser-failure-recoverable");
	expect(recoverableParse).toBeDefined();
	expect(recoverableParse.preservedSource).toBe(true);
	expect(recoverableParse.diagnosticCount).toBeGreaterThan(0);
	expect(phases).toContain("render");
	expect(phases).toContain("refresh");
	// sampleCount must be positive — exact value depends on harness defaultIterations
	expect(measurementRows[0].sampleCount).toBeGreaterThan(0);
	expect(measurementRows[0].p75).not.toBeNull();
	expect(measurementRows[0].p90).not.toBeNull();
	expect(measurementRows[0].p95).not.toBeNull();
	expect(measurementRows[0].p99).not.toBeNull();
	expect(measurementRows[0].standardDeviation).not.toBeNull();
	expect(draftGradient).toBeDefined();
	expect(draftGradient.phase).toBe("live-preview");
	expect(draftGradient.fixtureName).toBe("draft-gradient");
	expect(draftGradient.gradientCaseCount).toBe(4);
	expect(draftGradient.verifiedPreview).toBe(true);
	await testInfo.attach("perftest-browser-results.json",{
		body: JSON.stringify({
			runName: "browser-" + testInfo.project.name + "-" + Date.now(),
			results
		},null,2),
		contentType: "application/json"
	});
});
