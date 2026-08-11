/*\
title: test-filesystem-adversarial.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Adversarial tests for generateTiddlerFilepath: hostile titles and recorded
originalpaths (path traversal, absolute paths, control codes, reserved device
names, over-long and non-ASCII input) must still yield a filename valid on every
supported OS, without throwing or leaking a forbidden character. Only the
filename is sanitised; the tiddler title itself is never altered.

generateTiddlerFilepath is node-only (utils-node), so reproduce from the CLI, not
the browser. Save as probe.js in the repo root and run `node probe.js`:

	var path = require("path");
	var $tw = require("./boot/boot.js").TiddlyWiki();
	$tw.boot.argv = ["./editions/test"];
	$tw.boot.boot(function() {
		var dir = path.resolve("/tmp/tw5-probe");
		function base(t) { return path.basename($tw.utils.generateTiddlerFilepath(t,{extension: ".tid", directory: dir, fileInfo: {}})); }
		console.log(base("con"));         // expected: _con_.tid  (reserved device name wrapped)
		console.log(base("a<b>c"));       // expected: a_b_c.tid  (forbidden chars replaced)
		console.log(base("trailing "));   // expected: trailing_.tid  (trailing space replaced)
		process.exit(0);
	});

Control codes in the specs are built with String.fromCharCode so this source
stays pure ASCII. All path-logic tests use the real-save default overwrite:false.

\*/
"use strict";

if($tw.node) {

	var fs = require("fs");
	var path = require("path");

	describe("generateTiddlerFilepath (adversarial)", function() {

		var directory = path.resolve("/tmp/tw5-test-filesystem-adv");

		beforeEach(function() {
			fs.rmSync(directory,{recursive: true, force: true});
			fs.mkdirSync(directory,{recursive: true});
		});
		afterAll(function() {
			fs.rmSync(directory,{recursive: true, force: true});
		});

		function fromTitle(title) {
			return $tw.utils.generateTiddlerFilepath(title,{
				extension: ".tid",
				directory: directory,
				fileInfo: {}
			});
		}
		function fromOriginalpath(originalpath) {
			return $tw.utils.generateTiddlerFilepath("plain-title",{
				extension: ".tid",
				directory: directory,
				fileInfo: {originalpath: originalpath}
			});
		}

		// A saved path segment must contain no character Windows forbids in a
		// filename and no control code. "/" and "\" are separators between
		// segments; "." and ".." are dot segments, not filenames.
		function hasControlCode(seg) {
			for(var i = 0; i < seg.length; i++) {
				if(seg.charCodeAt(i) < 0x20) {
					return true;
				}
			}
			return false;
		}
		function eachSegment(result,callback) {
			path.relative(directory,result).split(/[\\/]/).forEach(function(seg) {
				if(seg !== "" && seg !== "." && seg !== "..") {
					callback(seg);
				}
			});
		}
		function expectCleanSegments(result) {
			eachSegment(result,function(seg) {
				expect(seg).not.toMatch(/[<>:"|?*]/);                              // Windows-forbidden chars
				expect(hasControlCode(seg)).toBe(false);                          // control codes
				expect(seg).not.toMatch(/^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i); // reserved device name
				expect(seg).not.toMatch(/[. ]$/);                                 // trailing dot or space
			});
		}

		// Control codes are built at runtime so the source stays pure ASCII.
		var NUL = String.fromCharCode(0), BEL = String.fromCharCode(7), US = String.fromCharCode(0x1f);

		// Battery of hostile inputs, fed through both the title and originalpath
		// channels.
		var hostile = [
			"../../../etc/passwd",
			"..\\..\\evil",
			"a<b>c:d\"e|f?g*h",
			"a" + NUL + "b" + BEL + "c" + US + "d",
			"con", "PRN", "nul", "COM1", "LPT9",
			"a/nul/b",
			"   leading",
			"trailing   ",
			"dots...",
			"café naïve",
			"中文テスト",
			new Array(400).join("z"),
			"<>:\"|?*",
			"//..//..//",
			"a/b\\c/d",
			"",
			".",
			"..",
			"::::",
			" "
		];

		it("never leaks a forbidden character or throws, for any hostile input", function() {
			hostile.forEach(function(input) {
				[fromTitle, function(t) { return fromOriginalpath(t + ".tid"); }].forEach(function(fn) {
					var result;
					expect(function() { result = fn(input); }).not.toThrow();
					expect(typeof result).toBe("string");
					expect(result.length).toBeGreaterThan(0);
					expectCleanSegments(result);
				});
			});
		});

		it("replaces control codes and NUL in the filename with underscore", function() {
			expect(path.basename(fromTitle("a" + NUL + "b" + US + "c"))).toBe("a_b_c.tid");
		});

		it("wraps a reserved Windows device name used as the whole title", function() {
			expect(path.basename(fromTitle("CON"))).toBe("_CON_.tid");
			expect(path.basename(fromTitle("nul"))).toBe("_nul_.tid");
			expect(path.basename(fromTitle("COM1"))).toBe("_COM1_.tid");
		});

		it("bounds the filename length for an over-long title", function() {
			var result = fromTitle(new Array(400).join("z"));
			expect(path.basename(result).length).toBeLessThanOrEqual(200 + ".tid".length);
		});

		it("transliterates non-ASCII to ASCII in every segment", function() {
			expect(path.basename(fromTitle("café"))).toBe("cafe.tid");
			eachSegment(fromOriginalpath("café/naïve.tid"),function(seg) {
				for(var i = 0; i < seg.length; i++) {
					expect(seg.charCodeAt(i)).toBeLessThan(128);
				}
			});
		});

		it("gives dots-only titles a valid, distinct, non-empty filename", function() {
			// "." and ".." are legal tiddler titles but not legal bare filenames.
			// The contract is a non-empty, forbidden-char-free name that is not a
			// hidden dotfile, and two different titles must not map to one file.
			// The exact fallback encoding is an implementation detail, not asserted.
			var dot = path.basename(fromTitle("."));
			var dotdot = path.basename(fromTitle(".."));
			[dot,dotdot].forEach(function(name) {
				expect(name.length).toBeGreaterThan(".tid".length);
				expect(name).not.toMatch(/[<>:"|?*]/);
				expect(name).not.toMatch(/^\.+/);
			});
			expect(dot).not.toBe(dotdot);
		});

	});

}
