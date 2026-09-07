/*\
title: test-freelinks.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the Freelinks rules that limit where automatic links appear.

To reproduce any of these by hand, install the Freelinks plugin, tick "Enable freelinking"
in the settings panel, create the tiddlers named in `makeWiki` below, then put the source
text of a test into a tiddler and read the rendered result.

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

describe("Freelinks", function() {

	// Chosen so that titles overlap: "Journal 1984" contains "1984", and "The Lord of the
	// Rings" contains both "Lord" and "Rings", which is what longest match and the escape
	// have to get right
	var TITLES = [
		"Homer",
		"Odysseus",
		"1984",
		"Journal 1984",
		"CamelCaseTitle",
		"This is a test",
		"The Lord of the Rings",
		"Lord",
		"Rings"
	];

	function makeWiki() {
		var wiki = new $tw.Wiki();
		TITLES.forEach(function(title) {
			wiki.addTiddler({title: title, text: "placeholder"});
		});
		wiki.addTiddler({title: "$:/config/Freelinks/Enable", text: "yes"});
		return wiki;
	}

	// Render a tiddler through the real freelinks path and reduce each anchor to [[target]]
	// so the assertions read as prose rather than as HTML
	function render(wiki,text,config,variables) {
		$tw.utils.each(config || {},function(value,title) {
			wiki.addTiddler({title: title, text: value});
		});
		wiki.deleteTiddler("Doc");
		wiki.clearCache("Doc");
		wiki.addTiddler({title: "Doc", text: text});
		var vars = {"tv-freelinks": "yes","currentTiddler": "Doc"};
		$tw.utils.each(variables || {},function(value,name) { vars[name] = value; });
		var widgetNode = wiki.makeTranscludeWidget("Doc",{
			document: $tw.fakeDocument,
			parseAsInline: false,
			variables: vars
		});
		var wrapper = $tw.fakeDocument.createElement("div");
		widgetNode.render(wrapper,null);
		return wrapper.innerHTML
			.replace(/<a class="[^"]*" href="#([^"]*)">([^<]*)<\/a>/g,"[[$2]]")
			.replace(/<\/?div>/g,"")
			.replace(/ class=""/g,"");
	}

	// Issue #9964: the core wikilinkprefix rule already strips the `~` and stamps the node,
	// so Freelinks must not undo the escape by linking the text again
	it("should not relink text escaped with the core `~` prefix", function() {
		var wiki = makeWiki();
		expect(render(wiki,"See CamelCaseTitle here")).toBe("<p>See [[CamelCaseTitle]] here</p>");
		expect(render(wiki,"See ~CamelCaseTitle here")).toBe("<p>See CamelCaseTitle here</p>");
	});

	// Issue #9964: the core escape only reaches CamelCase words, so a title with spaces was
	// left linked with a visible tilde
	it("should suppress a match of any length that is prefixed with `~`", function() {
		var wiki = makeWiki();
		expect(render(wiki,"This is a test")).toBe("<p>[[This is a test]]</p>");
		expect(render(wiki,"~This is a test")).toBe("<p>This is a test</p>");
		expect(render(wiki,"Try ~This is a test now")).toBe("<p>Try This is a test now</p>");
	});

	// Dropping the long match must not hand its span to the shorter titles inside it, which
	// would turn one unwanted link into two
	it("should claim the span of an escaped match so inner titles stay plain", function() {
		var wiki = makeWiki();
		expect(render(wiki,"Read The Lord of the Rings tonight"))
			.toBe("<p>Read [[The Lord of the Rings]] tonight</p>");
		expect(render(wiki,"Read ~The Lord of the Rings tonight"))
			.toBe("<p>Read The Lord of the Rings tonight</p>");
	});

	// The tilde is only consumed where it actually suppressed a link, so ordinary prose
	// keeps it
	it("should leave a tilde alone when it does not precede a match", function() {
		var wiki = makeWiki();
		expect(render(wiki,"about ~5 minutes")).toBe("<p>about ~5 minutes</p>");
		expect(render(wiki,"~No Such Tiddler here")).toBe("<p>~No Such Tiddler here</p>");
		expect(render(wiki,"see ~/config for details")).toBe("<p>see ~/config for details</p>");
	});

	// `<$text>` renders a literal string, so the escape must not rewrite it. A transcluded
	// field is different: it is wikified, which the bold markup below demonstrates, so
	// wikitext rules including the escape do apply there.
	it("should consume a tilde in wikified text but not in attribute text", function() {
		var wiki = makeWiki();
		expect(render(wiki,"<$text text=\"~This is a test\"/>"))
			.toBe("<p>~[[This is a test]]</p>");
		wiki.addTiddler({title: "Book", author: "~This is a test", note: "''bold''"});
		expect(render(wiki,"{{Book!!note}}")).toBe("<p><strong>bold</strong></p>");
		expect(render(wiki,"{{Book!!author}}")).toBe("<p>This is a test</p>");
	});

	// Chinese is written without spaces, so word boundary checking and the tilde escape both
	// take a different path than they do for Latin text. Issue #9964 named `~中文標題`.
	it("should freelink and escape titles written without word boundaries", function() {
		var wiki = makeWiki();
		wiki.addTiddler({title: "中文標題", text: "placeholder"});
		wiki.addTiddler({title: "中文", text: "placeholder"});
		// 的 is a common particle and not a title, so it must survive on both sides
		expect(render(wiki,"的中文標題的")).toBe("<p>的[[中文標題]]的</p>");
		// the longer title wins, and the shorter one still links where it stands alone
		expect(render(wiki,"中文的")).toBe("<p>[[中文]]的</p>");
		expect(render(wiki,"~中文標題")).toBe("<p>中文標題</p>");
	});

	// PR #9084 built the Aho-Corasick matcher for a 13,000 tiddler Chinese wiki, and its
	// motivating case was a long title carrying full-width punctuation such as ：(U+FF1A),
	// which no Latin word rule accounts for. PR #9676 then fixed the shorter title 雪狼
	// claiming the opening characters of the longer one.
	it("should link long Chinese titles containing full-width punctuation", function() {
		var wiki = makeWiki();
		wiki.addTiddler({title: "雪狼", text: "placeholder"});
		wiki.addTiddler({title: "雪狼湖", text: "placeholder"});
		wiki.addTiddler({title: "雪狼湖：活動", text: "placeholder"});
		expect(render(wiki,"CamelCaseTitle 和 雪狼湖：活動"))
			.toBe("<p>[[CamelCaseTitle]] 和 [[雪狼湖：活動]]</p>");
		// 雪狼湖活動 must not come apart into 雪狼 followed by 湖活動
		expect(render(wiki,"雪狼湖活動")).toBe("<p>[[雪狼湖]]活動</p>");
	});

	// PR #9676 fixed an index desync: lowercasing the whole text before searching could
	// change its length and split a surrogate pair, corrupting the output. Case conversion
	// is now done per character, which this pins by putting an astral character next to a
	// match while ignoring case.
	it("should keep astral characters intact when ignoring case", function() {
		var wiki = makeWiki();
		wiki.addTiddler({title: "ßeta", text: "placeholder"});
		wiki.addTiddler({title: "中文標題", text: "placeholder"});
		var ignoreCase = {"tv-freelinks-ignore-case": "yes"};
		expect(render(wiki,"ßeta☕ tail",null,ignoreCase)).toBe("<p>[[ßeta]]☕ tail</p>");
		// the match sits AFTER the surrogate pairs, so a desynced index would move or
		// truncate it rather than leave it alone
		expect(render(wiki,"🍎🍏 中文標題 tail",null,ignoreCase))
			.toBe("<p>🍎🍏 [[中文標題]] tail</p>");
	});

	// The matcher keeps each node's patterns under a reserved key, which used to be "$". A
	// title containing that character overwrote the list with a child node, so creating both
	// "US" and "US$" threw from addPattern and broke rendering, not just freelinking.
	it("should match titles containing the matcher's reserved character", function() {
		var wiki = makeWiki();
		wiki.addTiddler({title: "US", text: "placeholder"});
		wiki.addTiddler({title: "US$", text: "placeholder"});
		expect(render(wiki,"prices in US$ today")).toBe("<p>prices in [[US$]] today</p>");
		expect(render(wiki,"the US economy")).toBe("<p>the [[US]] economy</p>");
	});

	// PR #9676 folded the text one character at a time to stop an index desync, but kept
	// folding patterns as one string. "İ" folds to "i" plus a combining dot, so "İstanbul"
	// sat in a different space from its own pattern and could never match itself.
	it("should match a title whose case folding changes its length", function() {
		var wiki = makeWiki();
		wiki.addTiddler({title: "İstanbul", text: "placeholder"});
		var ignoreCase = {"tv-freelinks-ignore-case": "yes"};
		expect(render(wiki,"İstanbul here",null,ignoreCase)).toBe("<p>[[İstanbul]] here</p>");
		// a later match must not be shifted by the expansion that precedes it
		expect(render(wiki,"İstanbul and Homer",null,ignoreCase))
			.toBe("<p>[[İstanbul]] and [[Homer]]</p>");
	});

	it("should not link inside headings unless LinkInHeadings is set", function() {
		var wiki = makeWiki();
		expect(render(wiki,"!! The works of Homer")).toBe("<h2>The works of Homer</h2>");
		expect(render(wiki,"The works of Homer")).toBe("<p>The works of [[Homer]]</p>");
		expect(render(wiki,"!! The works of Homer",{"$:/config/Freelinks/LinkInHeadings": "yes"}))
			.toBe("<h2>The works of [[Homer]]</h2>");
	});

	// A bare number is almost never the link the author meant, but a longer title that
	// contains it still is, because longest match claims the span first
	it("should not link numeric titles while still linking longer titles containing them", function() {
		var wiki = makeWiki();
		expect(render(wiki,"born in 1984, see Journal 1984"))
			.toBe("<p>born in 1984, see [[Journal 1984]]</p>");
		expect(render(wiki,"born in 1984",{"$:/config/Freelinks/LinkNumbers": "yes"}))
			.toBe("<p>born in [[1984]]</p>");
	});

	// The point of LinkOnce: a tiddler is split into one text node per inline run, so a
	// decision made per node would restart at every paragraph, list item and emphasis
	it("should link only the first occurrence per tiddler, across text node boundaries", function() {
		var wiki = makeWiki();
		var once = {"$:/config/Freelinks/LinkOnce": "yes"};
		expect(render(wiki,"Homer wrote it. Homer again.",once))
			.toBe("<p>[[Homer]] wrote it. Homer again.</p>");
		expect(render(wiki,"Homer wrote it. //But// Homer again.",once))
			.toBe("<p>[[Homer]] wrote it. <em>But</em> Homer again.</p>");
		expect(render(wiki,"Homer wrote it.\n\nHomer again.",once))
			.toBe("<p>[[Homer]] wrote it.</p><p>Homer again.</p>");
		expect(render(wiki,"* Homer\n* Homer again",once))
			.toBe("<ul><li>[[Homer]]</li><li>Homer again</li></ul>");
		// each title is counted separately
		expect(render(wiki,"Homer and Odysseus, then Homer and Odysseus",once))
			.toBe("<p>[[Homer]] and [[Odysseus]], then Homer and Odysseus</p>");
		// an escaped occurrence must not claim the one link the tiddler gets
		expect(render(wiki,"~Homer wrote it. Homer again. Homer once more.",once))
			.toBe("<p>Homer wrote it. [[Homer]] again. Homer once more.</p>");
	});

	// The first occurrence is chosen by replaying the whole tiddler, so suppressed regions
	// must be skipped there too, or the link would be assigned to a heading and lost
	it("should pass the link to the body when the first occurrence is in a heading", function() {
		var wiki = makeWiki();
		expect(render(wiki,"!! About Homer\n\nHomer wrote it. Homer again.",
			{"$:/config/Freelinks/LinkOnce": "yes"}))
			.toBe("<h2>About Homer</h2><p>[[Homer]] wrote it. Homer again.</p>");
	});

	// Text supplied by an attribute has no position in the tiddler source, so the whole
	// tiddler replay cannot apply and LinkOnce falls back to suppressing repeats in the run
	it("should still suppress repeats in text that has no source position", function() {
		var wiki = makeWiki();
		expect(render(wiki,"<$text text=\"Homer and Homer again\"/>",
			{"$:/config/Freelinks/LinkOnce": "yes"}))
			.toBe("<p>[[Homer]] and Homer again</p>");
	});

	// The first occurrence map is cached per tiddler, which is not invalidated when some
	// OTHER tiddler appears, so it carries the title set generation. No cache is cleared by
	// hand here: creating and deleting a tiddler must be enough on its own.
	it("should follow the title set as tiddlers are created and deleted", function() {
		var wiki = makeWiki();
		var once = {"$:/config/Freelinks/LinkOnce": "yes"};
		expect(render(wiki,"Gamma and Homer and Gamma",once))
			.toBe("<p>Gamma and [[Homer]] and Gamma</p>");
		wiki.addTiddler({title: "Gamma", text: "placeholder"});
		expect(render(wiki,"Gamma and Homer and Gamma",once))
			.toBe("<p>[[Gamma]] and [[Homer]] and Gamma</p>");
		wiki.deleteTiddler("Gamma");
		expect(render(wiki,"Gamma and Homer and Gamma",once))
			.toBe("<p>Gamma and [[Homer]] and Gamma</p>");
	});

	// A draft is a transient copy, so linking "Draft of 'Homer'" is never useful. Keeping
	// drafts out also means typing does not change the title set, which is what lets the
	// automaton survive an edit instead of being rebuilt on every keystroke.
	it("should not freelink draft tiddlers", function() {
		var wiki = makeWiki();
		// A title that contains no other title, so the assertion is about the draft alone
		wiki.addTiddler({title: "Unsaved Sketch", text: "work in progress", "draft.of": "Homer"});
		expect(render(wiki,"See Unsaved Sketch and Homer"))
			.toBe("<p>See Unsaved Sketch and [[Homer]]</p>");
		// the same title without the draft field is linked as usual
		wiki.addTiddler({title: "Unsaved Sketch", text: "finished"});
		expect(render(wiki,"See Unsaved Sketch and Homer"))
			.toBe("<p>See [[Unsaved Sketch]] and [[Homer]]</p>");
	});
});
