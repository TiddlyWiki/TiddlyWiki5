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
				if(typeof $tw === "undefined") return { error: "$tw is undefined" };

				// Helper to safely execute a module
				const tryExecute = title => {
					try {
						const exports = $tw.modules.execute(title);
						return { success: true, exports: Object.keys(exports || {}) };
					} catch (e) {
						return { success: false, error: e.toString() };
					}
				};

				return {
					// Check if prosemirror state lib is loaded
					// library modules are not executed, but they populate dependencies?
					// We can try to execute it if it's a library.
					// But usually libraries are just require-able by other modules.
					// We can try to require it by mocking a require?
					// Or just check if it's in $tw.modules.titles?
					
					prosemirrorState: $tw.modules.titles["prosemirror-state"] ? "found" : "missing",
					widgetJs: $tw.modules.titles["$:/plugins/tiddlywiki/prosemirror/widget.js"] ? "found" : "missing",
					widgetLoader: $tw.modules.titles["$:/plugins/tiddlywiki/prosemirror/widget-loader.js"] ? "found" : "missing",
					
					// Try to execute widget-loader
					loaderExecution: tryExecute("$:/plugins/tiddlywiki/prosemirror/widget-loader.js"),
					
					// Check widget types again
					widgetTypes: Object.keys($tw.modules.types.widget || {})
				};
			} catch (e) {
				return { error: e.toString(), stack: e.stack };
			}
		});
		
		console.log("Module loading debug:", result);
		expect(result.success).toBe(true);
	});
});
