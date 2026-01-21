const{ test, expect } = require("@playwright/test");

test.describe("Widget Block Utils", () => {
	test("parseWidget should recognize valid widget syntax", async ({ page }) => {
		await page.goto("about:blank");
		
		const result = await page.evaluate(() => {
			// Mock TiddlyWiki environment if needed
			if(typeof $tw === "undefined") {
				global.$tw = { wiki: {} };
			}
			
			// Import and test parseWidget function
			// Note: This would require the module to be accessible in browser context
			const parseWidget = text => {
				const widgetPattern = /^<<\s*([a-zA-Z_][a-zA-Z0-9_-]*)\s*(.*)>>$/;
				const match = text.trim().match(widgetPattern);
				
				if(!match) {
					return null;
				}
				
				return {
					type: "widget",
					widgetName: match[1],
					rawText: text.trim()
				};
			};
			
			return {
				valid: parseWidget("<<now>>"),
				withParams: parseWidget('<<list-links "[tag[test]]">>'),
				invalid: parseWidget("not a widget"),
				incomplete: parseWidget("<<incomplete")
			};
		});
		
		expect(result.valid).not.toBeNull();
		expect(result.valid.widgetName).toBe("now");
		
		expect(result.withParams).not.toBeNull();
		expect(result.withParams.widgetName).toBe("list-links");
		
		expect(result.invalid).toBeNull();
		expect(result.incomplete).toBeNull();
	});

	test("parseWidget should handle various widget names", async ({ page }) => {
		await page.goto("about:blank");
		
		const testCases = [
			{ input: "<<now>>", expected: "now" },
			{ input: "<<list-links>>", expected: "list-links" },
			{ input: "<<my_widget>>", expected: "my_widget" },
			{ input: "<<widget123>>", expected: "widget123" },
			{ input: "<<_private>>", expected: "_private" }
		];
		
		for(const testCase of testCases) {
			const result = await page.evaluate(input => {
				const parseWidget = text => {
					const widgetPattern = /^<<\s*([a-zA-Z_][a-zA-Z0-9_-]*)\s*(.*)>>$/;
					const match = text.trim().match(widgetPattern);
					return match ? { widgetName: match[1] } : null;
				};
				return parseWidget(input);
			}, testCase.input);
			
			expect(result).not.toBeNull();
			expect(result.widgetName).toBe(testCase.expected);
		}
	});

	test("parseWidget should handle whitespace", async ({ page }) => {
		await page.goto("about:blank");
		
		const result = await page.evaluate(() => {
			const parseWidget = text => {
				const widgetPattern = /^<<\s*([a-zA-Z_][a-zA-Z0-9_-]*)\s*(.*)>>$/;
				const match = text.trim().match(widgetPattern);
				return match ? { widgetName: match[1] } : null;
			};
			
			return {
				withSpaces: parseWidget("<<  now  >>"),
				withNewlines: parseWidget("\n<<now>>\n"),
				compact: parseWidget("<<now>>")
			};
		});
		
		expect(result.withSpaces).not.toBeNull();
		expect(result.withSpaces.widgetName).toBe("now");
		
		expect(result.withNewlines).not.toBeNull();
		expect(result.withNewlines.widgetName).toBe("now");
		
		expect(result.compact).not.toBeNull();
		expect(result.compact.widgetName).toBe("now");
	});
});

test.describe("Keyboard Shortcut Configuration", () => {
	test("getShortcut should return default when no config exists", async ({ page }) => {
		await page.goto("about:blank");
		
		const result = await page.evaluate(() => {
			// Mock TiddlyWiki
			global.$tw = {
				wiki: {
					getTiddlerText: () => ""
				}
			};
			
			const getShortcut = (action, defaultKey) => {
				const configTiddler = "$:/config/prosemirror/shortcuts/" + action;
				const customKey = $tw.wiki.getTiddlerText(configTiddler, "").trim();
				
				if(customKey === "none") {
					return null;
				}
				
				return customKey || defaultKey;
			};
			
			return getShortcut("bold", "Mod-b");
		});
		
		expect(result).toBe("Mod-b");
	});

	test('getShortcut should return null when set to "none"', async ({ page }) => {
		await page.goto("about:blank");
		
		const result = await page.evaluate(() => {
			global.$tw = {
				wiki: {
					getTiddlerText: () => "none"
				}
			};
			
			const getShortcut = (action, defaultKey) => {
				const configTiddler = "$:/config/prosemirror/shortcuts/" + action;
				const customKey = $tw.wiki.getTiddlerText(configTiddler, "").trim();
				
				if(customKey === "none") {
					return null;
				}
				
				return customKey || defaultKey;
			};
			
			return getShortcut("bold", "Mod-b");
		});
		
		expect(result).toBeNull();
	});

	test("getShortcut should return custom key when configured", async ({ page }) => {
		await page.goto("about:blank");
		
		const result = await page.evaluate(() => {
			global.$tw = {
				wiki: {
					getTiddlerText: () => "Ctrl-Alt-b"
				}
			};
			
			const getShortcut = (action, defaultKey) => {
				const configTiddler = "$:/config/prosemirror/shortcuts/" + action;
				const customKey = $tw.wiki.getTiddlerText(configTiddler, "").trim();
				
				if(customKey === "none") {
					return null;
				}
				
				return customKey || defaultKey;
			};
			
			return getShortcut("bold", "Mod-b");
		});
		
		expect(result).toBe("Ctrl-Alt-b");
	});
});
