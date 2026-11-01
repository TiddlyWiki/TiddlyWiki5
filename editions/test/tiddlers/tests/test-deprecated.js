/*\
title: test-deprecated.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Regression-guard tests for $:/core/modules/utils/deprecated.js.

Locks in pre-5.4.0 tolerant behaviour of $tw.utils helpers that regressed
in PR #9251 (one-line modern equivalents diverge on edge-case inputs).
Without the companion restoration patch to core/modules/utils/deprecated.js:
8 specs fail. With the patch: green.

The addClass/removeClass/toggleClass specs at the end were moved from
test-utils.js — RSOD guard for the SampleWizard report (class field
"aaa bbb" crashing classList.add with InvalidCharacterError).

\*/

"use strict";

describe("deprecated.js — backwards-compat",function() {

	describe("$tw.utils.repeat",function() {
		it("returns '' for zero or negative count (does not throw)",function() {
			expect($tw.utils.repeat("x",0)).toBe("");
			expect($tw.utils.repeat("x",-1)).toBe("");
			expect($tw.utils.repeat("x",-100)).toBe("");
		});
		it("coerces null/undefined str rather than throwing",function() {
			expect($tw.utils.repeat(null,3)).toBe("nullnullnull");
			expect($tw.utils.repeat(undefined,2)).toBe("undefinedundefined");
		});
		it("still works for normal inputs",function() {
			expect($tw.utils.repeat("ab",3)).toBe("ababab");
			expect($tw.utils.repeat("-",5)).toBe("-----");
		});
	});

	describe("$tw.utils.startsWith / $tw.utils.endsWith",function() {
		it("tolerate a RegExp search argument without throwing",function() {
			// Old impl uses substring coercion; native String.prototype.startsWith
			// throws TypeError when passed a RegExp.
			expect(function() { $tw.utils.startsWith("abc",/a/); }).not.toThrow();
			expect(function() { $tw.utils.endsWith("abc",/c/); }).not.toThrow();
		});
		it("still match normal string inputs",function() {
			expect($tw.utils.startsWith("abcdef","abc")).toBe(true);
			expect($tw.utils.startsWith("abcdef","xyz")).toBe(false);
			expect($tw.utils.endsWith("abcdef","def")).toBe(true);
			expect($tw.utils.endsWith("abcdef","xyz")).toBe(false);
		});
	});

	describe("$tw.utils.stringifyNumber",function() {
		it("coerces null/undefined via string-concat rather than throwing",function() {
			expect($tw.utils.stringifyNumber(null)).toBe("null");
			expect($tw.utils.stringifyNumber(undefined)).toBe("undefined");
		});
		it("still returns a number's string form",function() {
			expect($tw.utils.stringifyNumber(42)).toBe("42");
			expect($tw.utils.stringifyNumber(-3.14)).toBe("-3.14");
			expect($tw.utils.stringifyNumber(0)).toBe("0");
		});
	});

	describe("$tw.utils.domContains",function() {
		// Stub nodes expose both .contains() and .compareDocumentPosition() so
		// both the old (compareDocumentPosition & 16 → number) and new
		// (a !== b && a.contains(b) → boolean) forms can be observed.
		function makeNode(children) {
			children = children || [];
			var self;
			self = {
				contains: function(other) {
					if(other === self) { return true; }
					return children.some(function(c) { return c === other || c.contains(other); });
				},
				compareDocumentPosition: function(other) {
					if(other === self) { return 0; }
					return self.contains(other) ? 16 : 0;
				}
			};
			return self;
		}
		it("returns strictly boolean true/false, not a bit-mask number",function() {
			var child = makeNode();
			var parent = makeNode([child]);
			var unrelated = makeNode();
			expect($tw.utils.domContains(parent,child)).toBe(true);
			expect($tw.utils.domContains(parent,unrelated)).toBe(false);
		});
		it("returns false for domContains(x, x)",function() {
			var a = makeNode();
			expect($tw.utils.domContains(a,a)).toBe(false);
		});
	});

	describe("$tw.utils.hasClass",function() {
		it("returns false for null/undefined element without throwing",function() {
			expect(function() { $tw.utils.hasClass(null,"foo"); }).not.toThrow();
			expect($tw.utils.hasClass(null,"foo")).toBe(false);
			expect(function() { $tw.utils.hasClass(undefined,"foo"); }).not.toThrow();
			expect($tw.utils.hasClass(undefined,"foo")).toBe(false);
		});
		it("returns strictly false (not undefined) for elements without classList",function() {
			expect($tw.utils.hasClass({},"foo")).toBe(false);
		});
		it("delegates to classList.contains for real elements",function() {
			var el = { classList: { contains: function(c) { return c === "a" || c === "b"; } } };
			expect($tw.utils.hasClass(el,"a")).toBe(true);
			expect($tw.utils.hasClass(el,"b")).toBe(true);
			expect($tw.utils.hasClass(el,"c")).toBe(false);
		});
	});

	// getLocationPath reads window.location: specs pend in Node (no `window`
	// in the TW5 sandbox) and use history.replaceState in the browser —
	// assigning to window.location would trigger a navigation and reload.
	describe("$tw.utils.getLocationPath",function() {
		var originalUrl;
		beforeEach(function() {
			if(!$tw.browser) { return; }
			originalUrl = window.location.href;
		});
		afterEach(function() {
			if(!$tw.browser) { return; }
			history.replaceState(null,"",originalUrl);
		});
		it("preserves the query string in the returned path",function() {
			if(!$tw.browser) { pending("browser-only: requires window.location - run in browser"); return; }
			history.replaceState(null,"","?lang=de&x=1#Intro");
			var path = $tw.utils.getLocationPath();
			expect(path).toContain("?lang=de&x=1");
			expect(path).not.toContain("#Intro");
		});
		it("strips the hash fragment",function() {
			if(!$tw.browser) { pending("browser-only: requires window.location - run in browser"); return; }
			history.replaceState(null,"","#SomeTiddler");
			// Sanity check: replaceState actually changed the hash.
			expect(window.location.hash).toBe("#SomeTiddler");
			var path = $tw.utils.getLocationPath();
			expect(path).not.toContain("#");
			// Rebuild expected href without the hash — works on http(s):// and file://.
			var expected = window.location.href.split("#")[0];
			expect(path).toBe(expected);
		});
		it("includes the query string when no hash is present",function() {
			if(!$tw.browser) { pending("browser-only: requires window.location - run in browser"); return; }
			history.replaceState(null,"","?x=1");
			var path = $tw.utils.getLocationPath();
			expect(path).toMatch(/\?x=1$/);
			expect(path).not.toContain("#");
		});
	});

	// Regression guard: classList.add/remove/toggle throw InvalidCharacterError on
	// whitespace. Manual repro: tw5-com #SampleWizard, class="aaa bbb", Done, popup
	// -> OK -> nested popup -> RSOD. Stub classList mirrors real DOM semantics
	// (reject whitespace, de-dupe on add, no-op on remove of missing token).
	describe("addClass/removeClass/toggleClass",function() {
		function makeEl() {
			var tokens = [];
			function reject(t) { if(/\s/.test(t)) { throw new Error("InvalidCharacterError: '" + t + "'"); } }
			return {
				classList: {
					add: function() {
						for(var i = 0; i < arguments.length; i++) {
							reject(arguments[i]);
							if(tokens.indexOf(arguments[i]) === -1) { tokens.push(arguments[i]); }
						}
					},
					remove: function() {
						for(var i = 0; i < arguments.length; i++) {
							reject(arguments[i]);
							var idx = tokens.indexOf(arguments[i]);
							if(idx !== -1) { tokens.splice(idx,1); }
						}
					},
					toggle: function(cls,status) {
						reject(cls);
						var has = tokens.indexOf(cls) !== -1;
						var want = status === undefined ? !has : status;
						if(want && !has) { tokens.push(cls); }
						if(!want && has) { tokens.splice(tokens.indexOf(cls),1); }
					}
				},
				_tokens: tokens
			};
		}

		it("splits on every ASCII-whitespace flavour (space, tab, newline, CR, mixed runs, leading/trailing)",function() {
			var el = makeEl();
			$tw.utils.addClass(el,"  a\tb\nc\r\nd  \t  e  ");
			expect(el._tokens).toEqual(["a","b","c","d","e"]);
		});

		it("splits on Unicode whitespace too (U+00A0 non-breaking space, a common paste-in hazard)",function() {
			var el = makeEl();
			$tw.utils.addClass(el,"a\u00A0b");
			expect(el._tokens).toEqual(["a","b"]);
		});

		it("de-duplicates tokens within one call and across calls",function() {
			var el = makeEl();
			$tw.utils.addClass(el,"x x y");
			$tw.utils.addClass(el,"y z");
			expect(el._tokens).toEqual(["x","y","z"]);
		});

		it("remove is a no-op for missing tokens and tolerates mixed-presence input",function() {
			var el = makeEl();
			$tw.utils.addClass(el,"a b");
			$tw.utils.removeClass(el,"b c d");
			expect(el._tokens).toEqual(["a"]);
		});

		it("toggle with no status flips each token independently",function() {
			var el = makeEl();
			$tw.utils.addClass(el,"a");
			$tw.utils.toggleClass(el,"a b");
			expect(el._tokens).toEqual(["b"]);
		});

		it("toggle with status=true/false forces state regardless of current",function() {
			var el = makeEl();
			$tw.utils.addClass(el,"a");
			$tw.utils.toggleClass(el,"a b",true);
			expect(el._tokens).toEqual(["a","b"]);
			$tw.utils.toggleClass(el,"a b",false);
			expect(el._tokens).toEqual([]);
		});

		it("is a silent no-op for whitespace-only / empty / non-string / null / undefined className",function() {
			var el = makeEl();
			var inputs = ["", "   \t\n ", null, undefined, 42, {}, ["a"]];
			inputs.forEach(function(v) {
				expect(function() { $tw.utils.addClass(el,v); }).not.toThrow();
				expect(function() { $tw.utils.removeClass(el,v); }).not.toThrow();
				expect(function() { $tw.utils.toggleClass(el,v); }).not.toThrow();
			});
			expect(el._tokens).toEqual([]);
		});

		it("is a silent no-op when element has no classList (SVG in old browsers, detached nodes, stubs)",function() {
			var el = {};
			expect(function() { $tw.utils.addClass(el,"a b"); }).not.toThrow();
			expect(function() { $tw.utils.removeClass(el,"a b"); }).not.toThrow();
			expect(function() { $tw.utils.toggleClass(el,"a b",true); }).not.toThrow();
		});
	});

});
