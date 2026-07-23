/*\
title: test-filesystem.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for $:/core-server filesystem utilities.

\*/
"use strict";

if($tw.node) {

	var path = require("path");

	describe("generateTiddlerFilepath", function() {

		var directory = path.resolve("/tmp/tw5-test-filesystem");

		// Characters stripped by the cross-platform-filename regex at
		// core-server/filesystem.js:356. Each entry is [char, description].
		// The forbidden set includes all characters disallowed by Windows
		// (< > : " | ? *), backslash (directory separator on Windows),
		// tilde (legacy 8.3 short-name marker), and caret (disallowed in
		// some shell/FS contexts).
		var forbiddenChars = [
			["<","less-than"],
			[">","greater-than"],
			["~","tilde"],
			[":","colon"],
			["\"","double-quote"],
			["|","pipe"],
			["?","question-mark"],
			["*","asterisk"],
			["^","caret"],
			["\\","backslash"]
		];

		// Use originalpath so we exercise the line-356 regex directly.
		// The title-branch at line ~342 pre-strips "/" and "\" before the
		// main regex runs, which would mask the backslash case.
		function filepathFromOriginalpath(title,extension) {
			return $tw.utils.generateTiddlerFilepath(title,{
				extension: extension,
				directory: directory,
				fileInfo: {
					overwrite: true,
					originalpath: title + extension
				}
			});
		}

		forbiddenChars.forEach(function(entry) {
			var char = entry[0], name = entry[1];
			it("should replace " + name + " (" + char + ") with underscore", function() {
				var result = filepathFromOriginalpath("a" + char + "b",".tid");
				expect(path.dirname(result)).toBe(directory);
				expect(path.basename(result)).toBe("a_b.tid");
			});
		});

		it("should replace every forbidden char in a dense string", function() {
			// Prefix with "x" so the sanitized result isn't all underscores,
			// which would trigger the charcode-fallback branch at line ~371.
			var title = "x" + forbiddenChars.map(function(e) { return e[0]; }).join("");
			var expected = "x" + forbiddenChars.map(function() { return "_"; }).join("");
			var result = filepathFromOriginalpath(title,".tid");
			expect(path.dirname(result)).toBe(directory);
			expect(path.basename(result)).toBe(expected + ".tid");
		});

		it("should sanitize real-world 'Pragma: \\define' title without creating a subdirectory", function() {
			// Issue for editions/tw5.com titles like "Pragma: \define".
			// Before the fix, backslash survived sanitization and path.resolve
			// treated it as a separator on Windows, producing a "Pragma_ "
			// subdir containing "define.tid".
			var result = filepathFromOriginalpath("Pragma: \\define",".tid");
			expect(path.dirname(result)).toBe(directory);
			expect(path.basename(result)).toBe("Pragma_ _define.tid");
		});

	});

}
