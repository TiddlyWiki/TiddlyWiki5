/*\
title: test-alias.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the module-alias field mechanism:
- $tw.modules.execute() resolves module-alias to the real module title
- alias field is a string array (space-separated, [[bracket]] for multi-word)
- real title takes priority over module-alias
- require() caches results correctly

\*/
"use strict";

describe("module-alias field tests", () => {

	// ─── module-alias field is a standard TW string array ───────────────────

	describe("module-alias field string array format", () => {
		it("should parse space-separated aliases", () => {
			const arr = $tw.utils.parseStringArray("foo bar baz");
			expect(arr).toEqual(["foo","bar","baz"]);
		});

		it("should parse [[bracket]] syntax for multi-word aliases", () => {
			const arr = $tw.utils.parseStringArray("foo [[hello world]] baz");
			expect(arr).toEqual(["foo","hello world","baz"]);
		});
	});

	// ─── require() via module-alias — the core use case from issue #8999 ────

	describe("$tw.modules.execute() with module-alias (require alias)", () => {
		// Use unique names to avoid polluting the shared global $tw.modules state
		const REAL_TITLE = "$:/test-module-alias/prosemirror-model-" + Date.now();
		const ALIAS_NAME = "test-module-alias-prosemirror-model-" + Date.now();
		let originalAliases;

		beforeEach(() => {
			// Save state
			originalAliases = $tw.utils.extend(Object.create(null),$tw.modules.aliases);
			// Register a library module with the full $:/ path
			$tw.modules.define(REAL_TITLE,"library",(module,exports) => {
				exports.name = "prosemirror-model";
				exports.version = "1.0.0";
			});
			// Register the alias mapping (normally done by defineTiddlerModules via the module-alias field)
			$tw.modules.aliases[ALIAS_NAME] = REAL_TITLE;
		});

		afterEach(() => {
			// Restore aliases, remove the test module
			$tw.modules.aliases = originalAliases;
			delete $tw.modules.titles[REAL_TITLE];
		});

		it("require(short-alias) should return the module exports of the real title", () => {
			// This is the core scenario from issue #8999:
			// require('prosemirror-model') resolves to $:/plugins/tiddlywiki/prosemirror/lib/prosemirror-model
			const result = $tw.modules.execute(ALIAS_NAME);
			expect(result).toBeDefined();
			expect(result.name).toBe("prosemirror-model");
			expect(result.version).toBe("1.0.0");
		});

		it("require(full-title) should still work as before", () => {
			const result = $tw.modules.execute(REAL_TITLE);
			expect(result).toBeDefined();
			expect(result.name).toBe("prosemirror-model");
		});

		it("require() result is cached — calling twice returns the same exports object", () => {
			const r1 = $tw.modules.execute(ALIAS_NAME);
			const r2 = $tw.modules.execute(ALIAS_NAME);
			expect(r1).toBe(r2);
		});

		it("module-alias should NOT shadow a real title — full title wins", () => {
			// If a module is registered both as a real title and also mapped via alias,
			// the real title takes priority over the alias resolution
			const DIRECT_TITLE = ALIAS_NAME;
			$tw.modules.define(DIRECT_TITLE,"library",(module,exports) => {
				exports.name = "direct";
			});
			const result = $tw.modules.execute(ALIAS_NAME);
			expect(result.name).toBe("direct");
			// cleanup
			delete $tw.modules.titles[DIRECT_TITLE];
		});

		it("multiple aliases can point to the same module", () => {
			const ALIAS2 = "test-module-alias-pm-model-" + Date.now();
			$tw.modules.aliases[ALIAS2] = REAL_TITLE;
			const r1 = $tw.modules.execute(ALIAS_NAME);
			const r2 = $tw.modules.execute(ALIAS2);
			expect(r1.name).toBe("prosemirror-model");
			expect(r2.name).toBe("prosemirror-model");
			delete $tw.modules.aliases[ALIAS2];
		});
	});

});
