/*\
title: test-parser-invariants.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Holds the wikitext parser to properties rather than to examples, since a parser that recovers must hold its guarantees against input nobody thought to write down.

The generator seeds itself, so a failure reproduces exactly rather than haunting a later run.

\*/

"use strict";

// A wikitext alphabet finds far more parser damage than random unicode, since the damage lives in the delimiters
var CHUNKS = [
	"''","//","__","~~","^^",",,","@@","`","```","<<<","@@color:red;",
	"<div>","</div>","<$list filter=\"[all[]]\">","</$list>","<%if [[a]] %>","<% endif %>",
	"\\define aMacro()","\\end","\\procedure aProc()","{{transclusion}}","[[a link]]","<<aMacro>>",
	"! heading","* item","|table|cell|","> quote",";definition",
	"\n","\n\n","\r\n"," ","plain words","$:/system/tiddler","{","}","[","]","|","-","\t"
];

// A tiny seeded generator, so a failing case reproduces from its seed rather than vanishing
function makeRandom(seed) {
	var state = seed >>> 0;
	return function() {
		state = (state * 1664525 + 1013904223) >>> 0;
		return state / 4294967296;
	};
}

function generateSource(random,chunkCount) {
	var parts = [];
	for(var i = 0; i < chunkCount; i++) {
		parts.push(CHUNKS[Math.floor(random() * CHUNKS.length)]);
	}
	return parts.join("");
}

var WELL_FORMED = [
	"A plain paragraph of prose.",
	"A paragraph carrying ''bold'', //italic// and `code`.",
	"! A heading\n\nA paragraph.\n\n* one\n* two\n",
	"\\define aMacro()\nthe body\n\\end\n\n<<aMacro>>\n",
	"<<<\nquoted\n<<<\n",
	"@@color:red;\nstyled\n@@\n",
	"<% if [[yes]] %>\nshown\n<% endif %>\n",
	"<div>\n\nblock content\n\n</div>\n",
	"''<div>\n\n* item one\n* item two\n</div>''\n"
];

describe("WikiParser invariants", function() {

	var SEVERITIES = ["error","warning","info","hint"];

	// I1 Totality: the parser owes a tree for every input, since one malformed tiddler must never take down a render
	it("never throws, whatever the source", function() {
		var wiki = new $tw.Wiki(),
			random = makeRandom(20260711);
		for(var i = 0; i < 400; i++) {
			var source = generateSource(random,1 + Math.floor(random() * 30));
			var parse = (function(text) {
				return function() {
					wiki.parseText("text/vnd.tiddlywiki",text);
				};
			})(source);
			expect(parse).not.toThrow();
		}
	});

	// I2 Termination: a recovery that fails to advance the parse position hangs the browser, so the parse must always halt
	it("halts on sources built to stall a recovery", function() {
		var wiki = new $tw.Wiki(),
			stallers = ["''","\n\n''","''\n\n","@@","<<<","\\define f()","``","''//__~~^^,,","\n\n\n\n","@@@@@@"];
		$tw.utils.each(stallers,function(source) {
			var parse = function() {
				wiki.parseText("text/vnd.tiddlywiki",source);
			};
			expect(parse).not.toThrow();
		});
	});

	// I5 Well formed diagnostics: an editor overlay keys on these ranges, so a range outside the source crashes the consumer
	it("keeps every diagnostic inside the source and inside the contract", function() {
		var wiki = new $tw.Wiki(),
			random = makeRandom(5150),
			checked = 0;
		for(var i = 0; i < 400; i++) {
			var source = generateSource(random,1 + Math.floor(random() * 30)),
				result = wiki.parseText("text/vnd.tiddlywiki",source);
			$tw.utils.each(result.diagnostics || [],function(diagnostic) {
				expect(diagnostic.from).not.toBeLessThan(0);
				expect(diagnostic.to).not.toBeLessThan(diagnostic.from);
				expect(diagnostic.to).not.toBeGreaterThan(source.length);
				expect(SEVERITIES).toContain(diagnostic.severity);
				expect(typeof diagnostic.code).toBe("string");
				expect(diagnostic.code.length).toBeGreaterThan(0);
				expect(typeof diagnostic.message).toBe("string");
				expect(diagnostic.source).toBeTruthy();
				checked++;
			});
		}
		// The generator must actually reach the recovery paths, or this spec proves nothing
		expect(checked).toBeGreaterThan(0);
	});

	// I6 Clean input purity: recovery machinery that fires on valid source would train authors to ignore it
	it("reports nothing on well formed source", function() {
		var wiki = new $tw.Wiki();
		$tw.utils.each(WELL_FORMED,function(source) {
			var result = wiki.parseText("text/vnd.tiddlywiki",source);
			expect(result.diagnostics.length).toBe(0);
		});
	});

	// I7 Idempotence: a rule instance that leaks state across parses renders the second tiddler wrong
	it("parses the same source to the same tree and the same diagnostics", function() {
		var wiki = new $tw.Wiki(),
			random = makeRandom(31337);
		for(var i = 0; i < 200; i++) {
			var source = generateSource(random,1 + Math.floor(random() * 20)),
				first = wiki.parseText("text/vnd.tiddlywiki",source),
				second = wiki.parseText("text/vnd.tiddlywiki",source);
			expect(JSON.stringify(second.tree)).toBe(JSON.stringify(first.tree));
			expect(JSON.stringify(second.diagnostics)).toBe(JSON.stringify(first.diagnostics));
		}
	});
});
