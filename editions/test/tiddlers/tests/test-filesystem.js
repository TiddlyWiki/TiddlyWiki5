/*\
title: test-filesystem.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for the $:/core-server filesystem utilities: generateTiddlerFilepath,
generateTiddlerFileInfo and generateTiddlerExtension. These are node-only
(module-type utils-node), so they run under `npm test` and are absent in the
browser: reproduce them from the CLI, not the F12 console.

Reproduce a case by hand. Save as probe.js in the repo root, run `node probe.js`,
and swap in the input and expected value from any spec below:

	var path = require("path");
	var $tw = require("./boot/boot.js").TiddlyWiki();
	$tw.boot.argv = ["./editions/test"];
	$tw.boot.boot(function() {
		var dir = path.resolve("/tmp/tw5-probe");
		var r = $tw.utils.generateTiddlerFilepath("a>b",{extension: ".tid", directory: dir, fileInfo: {}});
		console.log(path.basename(r));    // expected: a_b.tid
		process.exit(0);
	});

Reproduce the real client/server save (the retain-original-tiddler-path case).
From the repo root run:

	node ./tiddlywiki.js ./editions/tw5.com-server --listen

then in the browser edit a tiddler whose file lives in a subfolder, for example
examples/ButtonWidget/Popup.tid, save, and confirm on disk that the file stays in
examples/ButtonWidget/ rather than being flattened to the tiddlers root.

\*/
"use strict";

if($tw.node) {

	var fs = require("fs");
	var path = require("path");

	describe("generateTiddlerFilepath", function() {

		var directory = path.resolve("/tmp/tw5-test-filesystem");

		// Real saves use overwrite:false, which runs the uniquifier and probes the
		// filesystem. Start every test from an empty directory so the computed
		// filenames are deterministic. Only the dedicated overwrite test below
		// passes overwrite:true.
		beforeEach(function() {
			fs.rmSync(directory,{recursive: true, force: true});
			fs.mkdirSync(directory,{recursive: true});
		});
		afterAll(function() {
			fs.rmSync(directory,{recursive: true, force: true});
		});

		// Characters illegal in a filename on at least one supported OS (Windows
		// forbids < > : " / \ | ? *). generateTiddlerFilepath replaces each with
		// "_" so a tiddler file committed on one OS still checks out on every
		// other: an unsanitised "a>b.tid" would break `git checkout` on Windows.
		// Only the filename is sanitised; the tiddler title keeps the character.
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

		// Title channel: a title is plain text, so its slashes and backslashes are
		// not directory separators and every forbidden character is replaced.
		function filepathFromTitle(title) {
			return $tw.utils.generateTiddlerFilepath(title,{
				extension: ".tid",
				directory: directory,
				fileInfo: {}
			});
		}

		// OTP channel: originalpath ($:/config/OriginalTiddlerPaths) is a real
		// recorded relative location. Its separators are preserved; a forbidden
		// character inside a segment is still replaced. A distinct title proves the
		// filename derives from originalpath, not the title.
		function filepathFromOriginalpath(originalpath) {
			return $tw.utils.generateTiddlerFilepath("WrongIfUsed",{
				extension: ".tid",
				directory: directory,
				fileInfo: {originalpath: originalpath}
			});
		}

		// FileSystemPaths channel: a $:/config/FileSystemPaths filter builds the
		// path from the title, so a backslash leaking in from the title must be
		// sanitised. "[[...]]" echoes the literal.
		function filepathFromPathFilter(title,filter) {
			return $tw.utils.generateTiddlerFilepath(title,{
				extension: ".tid",
				directory: directory,
				wiki: $tw.wiki,
				pathFilters: [filter],
				fileInfo: {}
			});
		}

		forbiddenChars.forEach(function(entry) {
			var char = entry[0], name = entry[1];
			it("replaces " + name + " (" + char + ") in a title with underscore", function() {
				var result = filepathFromTitle("a" + char + "b");
				expect(path.dirname(result)).toBe(directory);
				expect(path.basename(result)).toBe("a_b.tid");
			});
		});

		it("replaces every forbidden char in a dense title", function() {
			// Prefix "x" so the result is not all underscores, which would trigger
			// the charcode-fallback branch in generateTiddlerFilepath.
			var title = "x" + forbiddenChars.map(function(e) { return e[0]; }).join("");
			var expected = "x" + forbiddenChars.map(function() { return "_"; }).join("");
			var result = filepathFromTitle(title);
			expect(path.dirname(result)).toBe(directory);
			expect(path.basename(result)).toBe(expected + ".tid");
		});

		it("does not overwrite a different tiddler that sanitises to the same filename", function() {
			// "a>b" and "a/b" are distinct titles that both sanitise to "a_b.tid".
			// With overwrite off (the real-save default) the second file gets a
			// uniquifier ("_1") rather than clobbering the first.
			fs.writeFileSync(path.resolve(directory,"a_b.tid"),"");
			var result = filepathFromTitle("a/b");
			expect(path.basename(result)).toBe("a_b_1.tid");
		});

		it("reuses the target filename when overwrite is set (the --save path)", function() {
			// overwrite:true (used by the --save command) writes a specific file
			// even if it already exists, so no uniquifier is added. This is the
			// only test allowed to pass overwrite:true.
			fs.writeFileSync(path.resolve(directory,"a_b.tid"),"");
			var result = $tw.utils.generateTiddlerFilepath("a/b",{
				extension: ".tid",
				directory: directory,
				fileInfo: {overwrite: true}
			});
			expect(path.basename(result)).toBe("a_b.tid");
		});

		it("sanitises a backslash from a FileSystemPaths filter without making a subdir (#9814)", function() {
			// A title such as "Pragma: \define" reaching the filename via a
			// FileSystemPaths filter must not act as a Windows path separator.
			var result = filepathFromPathFilter("Pragma: \\define","[[Pragma: \\define]]");
			expect(path.dirname(result)).toBe(directory);
			expect(path.basename(result)).toBe("Pragma_ _define.tid");
		});

		it("keeps the subdirectory of a retained originalpath (native separators)", function() {
			// Regression: on Windows path.relative yields backslash separators, so
			// originalpath is e.g. "examples\ButtonWidget\Popup.tid". They must be
			// preserved so the tiddler saves back to its folder rather than being
			// flattened to "examples_ButtonWidget_Popup.tid" at the tiddlers root.
			var original = ["examples","ButtonWidget","Popup"].join(path.sep) + ".tid";
			var result = filepathFromOriginalpath(original);
			expect(path.dirname(result)).toBe(path.resolve(directory,"examples","ButtonWidget"));
			expect(path.basename(result)).toBe("Popup.tid");
		});

		it("keeps the subdirectory of a retained originalpath (forward slashes)", function() {
			var result = filepathFromOriginalpath("examples/ButtonWidget/Popup.tid");
			expect(path.dirname(result)).toBe(path.resolve(directory,"examples","ButtonWidget"));
			expect(path.basename(result)).toBe("Popup.tid");
		});

		it("still sanitises a forbidden char inside an originalpath segment", function() {
			// ">" is a legal filename char on Linux and macOS but forbidden on
			// Windows. The sanitiser always targets the strictest OS, so a file
			// committed on Linux still checks out on Windows: an unsanitised
			// "a>b.tid" would break `git checkout` there and brick the clone.
			// The ">" is replaced while the "sub/" directory is kept.
			var result = filepathFromOriginalpath("sub/a>b.tid");
			expect(path.dirname(result)).toBe(path.resolve(directory,"sub"));
			expect(path.basename(result)).toBe("a_b.tid");
		});

		it("replaces trailing dots and spaces in a filename", function() {
			// Windows silently strips a trailing dot or space from a filename, so
			// they are replaced to keep the name stable across platforms, in a
			// title and inside an originalpath segment alike.
			expect(path.basename(filepathFromTitle("foo."))).toBe("foo_.tid");
			expect(path.basename(filepathFromTitle("foo "))).toBe("foo_.tid");
			expect(path.basename(filepathFromOriginalpath("sub/foo..tid"))).toBe("foo_.tid");
		});

		it("uses a tiddlywiki.files pinned path verbatim, skipping sanitisation", function() {
			// A pinFilepath (tiddlywiki.files) path is author-controlled and
			// trusted: separators are kept and the forbidden-char sanitiser is
			// skipped, so a tilde (which it would otherwise replace) survives.
			var result = $tw.utils.generateTiddlerFilepath("WrongIfUsed",{
				extension: ".tid",
				directory: directory,
				fileInfo: {pinFilepath: true, originalpath: "pinned/a~b.tid"}
			});
			expect(path.dirname(result)).toBe(path.resolve(directory,"pinned"));
			expect(path.basename(result)).toBe("a~b.tid");
		});

		it("falls back to originalpath when no FileSystemPaths filter matches", function() {
			// A filter that selects nothing for this tiddler leaves the recorded
			// originalpath in charge of the location.
			var result = $tw.utils.generateTiddlerFilepath("WrongIfUsed",{
				extension: ".tid",
				directory: directory,
				wiki: $tw.wiki,
				pathFilters: ["[tag[__no_such_tag__]]"],
				fileInfo: {originalpath: "examples/ButtonWidget/Popup.tid"}
			});
			expect(path.dirname(result)).toBe(path.resolve(directory,"examples","ButtonWidget"));
			expect(path.basename(result)).toBe("Popup.tid");
		});

		it("replaces leading spaces in a title with underscores", function() {
			expect(path.basename(filepathFromTitle("  foo"))).toBe("__foo.tid");
		});

		it("replaces leading dots so the file is not hidden on unix", function() {
			expect(path.basename(filepathFromTitle(".hidden"))).toBe("_hidden.tid");
			expect(path.basename(filepathFromTitle("..twodots"))).toBe("__twodots.tid");
		});

		it("replaces trailing dots or spaces in the extension", function() {
			var result = $tw.utils.generateTiddlerFilepath("foo",{
				extension: ".tid.",
				directory: directory,
				fileInfo: {}
			});
			expect(path.basename(result)).toBe("foo.tid_");
		});

		it("truncates an over-long extension to 32 characters", function() {
			var longExt = "." + new Array(50).join("x");
			var result = $tw.utils.generateTiddlerFilepath("foo",{
				extension: longExt,
				directory: directory,
				fileInfo: {}
			});
			expect(path.basename(result)).toBe("foo" + longExt.substr(0,32));
		});

		it("does not double the extension when the title already ends in it", function() {
			// "notes.tid" with extension ".tid" must yield "notes.tid", not
			// "notes.tid.tid".
			expect(path.basename(filepathFromTitle("notes.tid"))).toBe("notes.tid");
		});

		it("keeps its own filename when an existing tiddler is re-saved", function() {
			// The tiddler already owns "a_b.tid" (fileInfo.filepath). Re-saving
			// reuses it instead of appending a "_1" uniquifier, which would
			// otherwise orphan a copy on every save.
			var owned = path.resolve(directory,"a_b.tid");
			fs.writeFileSync(owned,"");
			var result = $tw.utils.generateTiddlerFilepath("a/b",{
				extension: ".tid",
				directory: directory,
				fileInfo: {filepath: owned}
			});
			expect(path.basename(result)).toBe("a_b.tid");
		});

		it("URI-encodes the filename after a write error", function() {
			// fileInfo.writeError forces the encoded fallback so a retry can write
			// a name the filesystem will accept.
			var result = $tw.utils.generateTiddlerFilepath("plain",{
				extension: ".tid",
				directory: directory,
				fileInfo: {writeError: true}
			});
			expect(path.dirname(result)).toBe(directory);
			expect(path.basename(result)).not.toBe("plain.tid");
			expect(path.basename(result)).toContain("plain.tid");
		});

		it("folds a path that escapes all allowed roots back into the directory", function() {
			// An originalpath resolving outside directory / wikiTiddlersPath is
			// encoded into a single filename inside directory rather than escaping.
			var result = $tw.utils.generateTiddlerFilepath("plain",{
				extension: ".tid",
				directory: directory,
				fileInfo: {originalpath: "../../../outside/evil.tid"}
			});
			expect(path.dirname(result)).toBe(directory);
		});

	});

	describe("generateTiddlerFileInfo", function() {

		var directory = path.resolve("/tmp/tw5-test-filesystem");

		function fileInfoFor(fields,existing) {
			return $tw.utils.generateTiddlerFileInfo(new $tw.Tiddler(fields),{
				directory: directory,
				wiki: $tw.wiki,
				fileInfo: existing || {}
			});
		}

		it("saves a wikitext tiddler as a single .tid file", function() {
			var fi = fileInfoFor({title: "Foo", text: "body", type: "text/vnd.tiddlywiki"});
			expect(fi.type).toBe("application/x-tiddler");
			expect(fi.hasMetaFile).toBe(false);
		});

		it("saves a non-wikitext tiddler as a body file plus a .meta file", function() {
			var fi = fileInfoFor({title: "Foo", text: "body", type: "text/plain"});
			expect(fi.type).toBe("text/plain");
			expect(fi.hasMetaFile).toBe(true);
		});

		it("saves a tiddler with an unsafe field value as JSON", function() {
			// A field value with leading whitespace cannot round-trip through a
			// .tid header, so the whole tiddler is written as JSON.
			var fi = fileInfoFor({title: "Foo", text: "body", type: "text/vnd.tiddlywiki", custom: " leading"});
			expect(fi.type).toBe("application/json");
			expect(fi.hasMetaFile).toBe(false);
		});

		it("keeps a tiddler with a _canonical_uri as a .tid file", function() {
			var fi = fileInfoFor({title: "Img", type: "image/png", _canonical_uri: "images/x.png"});
			expect(fi.type).toBe("application/x-tiddler");
		});

		it("propagates isEditableFile and originalpath from the existing fileInfo", function() {
			var fi = fileInfoFor({title: "Foo", text: "b", type: "text/vnd.tiddlywiki"},{isEditableFile: true, originalpath: "sub/Foo.tid"});
			expect(fi.isEditableFile).toBe(true);
			expect(fi.originalpath).toBe("sub/Foo.tid");
		});

	});

	describe("generateTiddlerExtension", function() {

		it("returns the extension from the first matching extFilter", function() {
			var ext = $tw.utils.generateTiddlerExtension("Foo",{
				extFilters: ["[[Foo]then[.md]]"],
				wiki: $tw.wiki
			});
			expect(ext).toBe(".md");
		});

		it("returns undefined when no extFilter matches", function() {
			var ext = $tw.utils.generateTiddlerExtension("Foo",{
				extFilters: ["[tag[__no_such_tag__]then[.md]]"],
				wiki: $tw.wiki
			});
			expect(ext).toBeUndefined();
		});

	});

}
