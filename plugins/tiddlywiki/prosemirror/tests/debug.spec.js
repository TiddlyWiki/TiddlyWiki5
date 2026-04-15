const{ test, expect } = require("@playwright/test");
const{ resolve } = require("path");

test.describe("ProseMirror Editor - Module Debug", () => {
	test("debug module loading", async ({ page }) => {
		const indexPath = resolve(process.cwd(), "editions/test/output", "test.html");
		const crossPlatformIndexPath = indexPath.replace(/^\/+/, "");
		
		await page.goto(`file:///${crossPlatformIndexPath}`);
		await page.waitForSelector(".tc-site-title", { timeout: 10000 });
		
		const result = await page.evaluate(() => {
			try {
				if(typeof $tw === "undefined") return { success: false, error: "$tw is undefined" };

				// Helper to safely execute a module
				const tryExecute = title => {
					try {
						const exports = $tw.modules.execute(title);
						return { success: true, exports: Object.keys(exports || {}) };
					} catch (e) {
						return { success: false, error: e.toString() };
					}
				};

				const data = {
					prosemirrorState: $tw.modules.titles["prosemirror-state"] ? "found" : "missing",
					widgetJs: $tw.modules.titles["$:/plugins/tiddlywiki/prosemirror/core/widget.js"] ? "found" : "missing",
					widgetLoader: $tw.modules.titles["$:/plugins/tiddlywiki/prosemirror/core/widget-loader.js"] ? "found" : "missing",
					loaderExecution: tryExecute("$:/plugins/tiddlywiki/prosemirror/core/widget-loader.js"),
					widgetTypes: Object.keys($tw.modules.types.widget || {})
				};

				// Overall success: core modules found and loader executed without error
				data.success = data.prosemirrorState === "found"
					&& data.widgetJs === "found"
					&& data.widgetLoader === "found"
					&& data.loaderExecution.success;

				return data;
			} catch (e) {
				return { success: false, error: e.toString(), stack: e.stack };
			}
		});
		
		console.log("Module loading debug:", result);
		expect(result.success).toBe(true);
	});
});
