/*\
title: test-wiki-parse-recovery.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests parser recovery for source faults while unexpected parser failures keep throwing.

\*/

"use strict";

describe("Wiki.parseText recovery", function() {

	function renderParser(wiki,parser) {
		var widgetNode = wiki.makeWidget(parser,{document: $tw.fakeDocument}),
			wrapper = $tw.fakeDocument.createElement("div");
		widgetNode.render(wrapper,null);
		return wrapper;
	}

	it("rethrows parser errors by default", function() {
		var wiki = new $tw.Wiki(),
			previousParser = $tw.Wiki.parsers["text/x-throwing-test"];
		$tw.Wiki.parsers["text/x-throwing-test"] = function() {
			throw new Error("parse boom");
		};
		try {
			expect(function() {
				wiki.parseText("text/x-throwing-test","source");
			}).toThrow();
		} finally{
			if(previousParser) {
				$tw.Wiki.parsers["text/x-throwing-test"] = previousParser;
			} else {
				delete $tw.Wiki.parsers["text/x-throwing-test"];
			}
		}
	});

	it("returns a parser-compatible source-preserving tree for a recoverable parser failure", function() {
		var wiki = new $tw.Wiki(),
			previousParser = $tw.Wiki.parsers["text/x-throwing-test"],
			parser;
		$tw.Wiki.parsers["text/x-throwing-test"] = function() {
			throw new $tw.utils.RecoverableParseError({
				from: 2,
				to: 5,
				code: "test-grammar",
				message: "parse boom"
			});
		};
		try {
			parser = wiki.parseText("text/x-throwing-test","source");
			expect(parser.type).toBe("text/x-throwing-test");
			expect(parser.source).toBe("source");
			expect(parser.tree[0].type).toBe("text");
			expect(parser.tree[0].text).toBe("source");
			expect(parser.diagnostics).toEqual([{
				from: 2,
				to: 5,
				severity: "error",
				source: "text/x-throwing-test",
				code: "test-grammar",
				message: "parse boom"
			}]);
		} finally{
			if(previousParser) {
				$tw.Wiki.parsers["text/x-throwing-test"] = previousParser;
			} else {
				delete $tw.Wiki.parsers["text/x-throwing-test"];
			}
		}
	});

	it("renders recovered source without losing typed content", function() {
		var wiki = new $tw.Wiki(),
			previousParser = $tw.Wiki.parsers["text/x-throwing-test"],
			parser,
			wrapper;
		$tw.Wiki.parsers["text/x-throwing-test"] = function() {
			throw new $tw.utils.RecoverableParseError({message: "parse boom"});
		};
		try {
			parser = wiki.parseText("text/x-throwing-test","source");
			wrapper = renderParser(wiki,parser);
			expect(wrapper.innerHTML).toContain("source");
			expect(wrapper.innerHTML).not.toContain("tc-error");
		} finally{
			if(previousParser) {
				$tw.Wiki.parsers["text/x-throwing-test"] = previousParser;
			} else {
				delete $tw.Wiki.parsers["text/x-throwing-test"];
			}
		}
	});

	it("renders incomplete base wikitext along its existing recovery gradient", function() {
		var wiki = new $tw.Wiki(),
			cases = [
				{text: "before <<unfinished", rendered: "before <<unfinished"},
				{text: "before [[unfinished", rendered: "before [[unfinished"},
				{text: "before <$text text=\"unfinished", rendered: "before <$text text=\"unfinished"},
				{text: "before <$list filter={{{ [tag[unfinished]] }}", rendered: "before <$list filter={"}
			];
		$tw.utils.each(cases,function(item) {
			var parser = wiki.parseText("text/vnd.tiddlywiki",item.text),
				wrapper = renderParser(wiki,parser);
			expect(wrapper.textContent).toBe(item.rendered);
		});
	});

	it("keeps a partial tree supplied by a recoverable parser failure", function() {
		var wiki = new $tw.Wiki(),
			previousParser = $tw.Wiki.parsers["text/x-throwing-test"],
			parser,
			partialTree = [{type: "text", text: "before"}];
		$tw.Wiki.parsers["text/x-throwing-test"] = function() {
			throw new $tw.utils.RecoverableParseError({message: "parse boom"},partialTree);
		};
		try {
			parser = wiki.parseText("text/x-throwing-test","before broken");
			expect(parser.tree).toBe(partialTree);
			expect(parser.diagnostics[0].message).toBe("parse boom");
		} finally{
			if(previousParser) {
				$tw.Wiki.parsers["text/x-throwing-test"] = previousParser;
			} else {
				delete $tw.Wiki.parsers["text/x-throwing-test"];
			}
		}
	});

	it("normalizes a recoverable diagnostic range to the source", function() {
		var wiki = new $tw.Wiki(),
			previousParser = $tw.Wiki.parsers["text/x-throwing-test"],
			parser;
		$tw.Wiki.parsers["text/x-throwing-test"] = function() {
			throw new $tw.utils.RecoverableParseError({
				from: -5,
				to: Infinity,
				severity: "warning",
				message: "parse boom"
			});
		};
		try {
			parser = wiki.parseText("text/x-throwing-test","source");
			expect(parser.diagnostics[0].from).toBe(0);
			expect(parser.diagnostics[0].to).toBe(0);
			expect(parser.diagnostics[0].severity).toBe("warning");
		} finally{
			if(previousParser) {
				$tw.Wiki.parsers["text/x-throwing-test"] = previousParser;
			} else {
				delete $tw.Wiki.parsers["text/x-throwing-test"];
			}
		}
	});

	it("caches one recovered parse result for a tiddler", function() {
		var wiki = new $tw.Wiki(),
			previousParser = $tw.Wiki.parsers["text/x-throwing-test"],
			tiddlerTitle = "$:/temp/parse-recovery-cache";
		$tw.Wiki.parsers["text/x-throwing-test"] = function() {
			throw new $tw.utils.RecoverableParseError({message: "parse boom"});
		};
		wiki.addTiddler({title: tiddlerTitle, type: "text/x-throwing-test", text: "source"});
		try {
			var first = wiki.parseTiddler(tiddlerTitle),
				second = wiki.parseTiddler(tiddlerTitle);
			expect(first).toBe(second);
			expect(first.diagnostics[0].message).toBe("parse boom");
		} finally{
			if(previousParser) {
				$tw.Wiki.parsers["text/x-throwing-test"] = previousParser;
			} else {
				delete $tw.Wiki.parsers["text/x-throwing-test"];
			}
		}
	});
});

describe("WikiParser block-level recovery", function() {

	var WikiParser = $tw.Wiki.parsers["text/vnd.tiddlywiki"];

	function withThrowingBlockRule(ruleName,makeError,fn) {
		var wiki = new $tw.Wiki();
		// Prime the lazily-created rule classes before patching one
		wiki.parseText("text/vnd.tiddlywiki","prime");
		var ruleClass = WikiParser.prototype.blockRuleClasses[ruleName],
			original = ruleClass.prototype.parse;
		ruleClass.prototype.parse = function() {
			throw makeError();
		};
		try {
			return fn(wiki);
		} finally{
			ruleClass.prototype.parse = original;
		}
	}

	it("recovers a single failing block to source text and keeps surrounding blocks", function() {
		var result = withThrowingBlockRule("heading",function() {
			return new $tw.utils.RecoverableParseError({code: "test-block", message: "block boom"});
		},function(wiki) {
			return wiki.parseText("text/vnd.tiddlywiki","para one\n\n! Heading here\n\npara two");
		});
		expect(result.tree.length).toBe(3);
		expect(result.tree[0].type).toBe("element");
		expect(result.tree[0].tag).toBe("p");
		expect(result.tree[1].type).toBe("text");
		expect(result.tree[1].text.indexOf("! Heading here")).toBe(0);
		expect(result.tree[2].type).toBe("element");
		expect(result.tree[2].tag).toBe("p");
		expect(result.diagnostics.length).toBe(1);
		expect(result.diagnostics[0].message).toBe("block boom");
		expect(result.diagnostics[0].code).toBe("test-block");
	});

	it("rethrows a non-recoverable block error", function() {
		expect(function() {
			withThrowingBlockRule("heading",function() {
				return new Error("hard boom");
			},function(wiki) {
				wiki.parseText("text/vnd.tiddlywiki","! Heading");
			});
		}).toThrow();
	});

	it("normalizes and clamps a block diagnostic range to the source", function() {
		var result = withThrowingBlockRule("heading",function() {
			return new $tw.utils.RecoverableParseError({from: -3, to: 99999, severity: "warning", message: "boom"});
		},function(wiki) {
			return wiki.parseText("text/vnd.tiddlywiki","! Heading");
		});
		expect(result.diagnostics[0].from).toBe(0);
		expect(result.diagnostics[0].to).toBe(result.source.length);
		expect(result.diagnostics[0].severity).toBe("warning");
	});

	it("recovers the final block when there is no trailing boundary", function() {
		var result = withThrowingBlockRule("heading",function() {
			return new $tw.utils.RecoverableParseError({message: "boom"});
		},function(wiki) {
			return wiki.parseText("text/vnd.tiddlywiki","para one\n\n! Heading at end");
		});
		expect(result.tree[0].tag).toBe("p");
		var last = result.tree[result.tree.length - 1];
		expect(last.type).toBe("text");
		expect(last.text.indexOf("! Heading at end")).toBe(0);
		expect(result.diagnostics.length).toBe(1);
	});
});
