/*\
title: test-paragraph-widget.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the paragraph widget, which decides at render time whether a block run keeps the
paragraph the parser proposed.

Two classes of defect are guarded here.

The first is refresh, and it is the reason this file exists. The rest of the suite proves a
first render; the widget has to retake its decision whenever a child changes, and moving DOM
after rendering leaves stale references behind. Three bugs of this class shipped and were
found by a human clicking: a sidebar search dropdown that silently stopped opening because
descendants still pointed at the discarded paragraph, a $reveal that doubled the buttons
above it on every show/hide because the re-render condition was inverted, and text that lost
its paragraph because a cached node list went stale. The specs that guard those refresh
several times over and assert the counts come back.

The second is markup validity: a paragraph containing a block element is markup no browser
will build, so the interactive DOM and any static render of the same source disagree.

Note the last spec is a FIXTURE LINT, not a widget test. It reads expectation strings and
never renders anything, so it cannot detect a defect in the widget. It is here because a
wrong expectation is how 75 invalid paragraphs went unnoticed in the first place.

\*/

"use strict";

describe("Paragraph widget", function() {

	var widget = require("$:/core/modules/widgets/widget.js");

	function render(text,wiki) {
		var parser = wiki.parseText("text/vnd.tiddlywiki",text,{parseAsInline: false}),
			widgetNode = new widget.widget({type: "widget", children: parser.tree},{
				wiki: wiki,
				document: $tw.fakeDocument
			}),
			wrapper = $tw.fakeDocument.createElement("div");
		$tw.fakeDocument.setSequenceNumber(0);
		widgetNode.render(wrapper,null);
		return {widgetNode: widgetNode, wrapper: wrapper};
	}

	function refresh(rendered,changedTitles) {
		var changedTiddlers = {};
		$tw.utils.each(changedTitles,function(title) {
			changedTiddlers[title] = true;
		});
		rendered.widgetNode.refresh(changedTiddlers,rendered.wrapper,null);
	}

	function count(wrapper,tagName) {
		var total = 0;
		(function walk(node) {
			$tw.utils.each(node.childNodes || [],function(child) {
				if(child.nodeType === 1) {
					if((child.tagName || "").toLowerCase() === tagName) {
						total++;
					}
					walk(child);
				}
			});
		})(wrapper);
		return total;
	}

	it("should re-render only when its decision actually changes", function() {
		// Guards the shipped bug where clicking show/hide/show on a $reveal doubled the
		// buttons above it, 2 to 4 to 6 to 8. The cause was a refresh condition that
		// rebuilt the run on every refresh rather than only when the wrap decision flipped.
		// Counting elements does not detect it, because rebuilding cleans up after itself.
		// Node IDENTITY does: a paragraph that survives a refresh must be the same node.
		// CHECK BY HAND: open TestCases/RevealWidget/SimpleReveal and click Show me and
		// Hide me a few times. The two buttons above the reveal must stay two
		var wiki = $tw.test.wiki();
		wiki.addTiddler({title: "Content", text: "words"});
		wiki.addTiddler({title: "Unrelated", text: "x"});
		var rendered = render('lead <$transclude tiddler="Content" mode="inline"/> tail\n',wiki),
			paragraph = rendered.wrapper.firstChild;
		expect((paragraph.tagName || "").toLowerCase()).toBe("p");
		for(var pass=0; pass<3; pass++) {
			// The decision cannot change, so the very same DOM node must still be there
			wiki.addTiddler({title: "Content", text: "words " + pass});
			refresh(rendered,["Content"]);
			expect(rendered.wrapper.firstChild).toBe(paragraph);
			refresh(rendered,["Unrelated"]);
			expect(rendered.wrapper.firstChild).toBe(paragraph);
		}
	});

	it("should keep rendering into the live DOM after the paragraph is discarded", function() {
		// Guards the shipped bug where the sidebar search dropdown silently stopped
		// opening, with no error. A descendant rendered straight into the paragraph and
		// cached it as its parent node; a pass-through such as $let puts that node
		// arbitrarily deep. Once the run turned out to be block the paragraph was thrown
		// away, and the next refresh rendered into the discarded node, so nothing appeared.
		// The run must UNWRAP for this to bite, which is why Content starts as a block.
		// CHECK BY HAND: type Welcome into the sidebar search. A dropdown of results must
		// appear. Clear it and type again a few times, it must appear every time
		var wiki = $tw.test.wiki();
		wiki.addTiddler({title: "Content", text: "<div>first</div>"});
		var rendered = render('lead <$let unused="1"><$transclude tiddler="Content" mode="inline"/></$let> tail\n',wiki);
		expect(rendered.wrapper.textContent).toContain("first");
		for(var pass=0; pass<3; pass++) {
			wiki.addTiddler({title: "Content", text: "<div>updated" + pass + "</div>"});
			refresh(rendered,["Content"]);
			expect(rendered.wrapper.textContent).toContain("updated" + pass);
		}
	});

	it("should retake its decision when content changes between inline and block", function() {
		// The decision depends on what the children rendered, so it has to be retaken when
		// they change. A run that turns out to hold a block must be split the way a browser
		// splits it, and must go back to one paragraph when the block goes away, repeatedly
		// and without leaving orphaned nodes behind.
		// Text either side of the transclusion is what puts this in a paragraph run at all:
		// a self closing tag followed by end of source passes the html block gate instead.
		// CHECK BY HAND: make a tiddler holding  lead {{Content}} tail  and a tiddler
		// Content holding  words . Edit Content to  <div>block</div>  and back again. The
		// text either side must stay visible each time, never swallowed or duplicated
		var wiki = $tw.test.wiki();
		wiki.addTiddler({title: "Content", text: "words"});
		var rendered = render('lead <$transclude tiddler="Content" mode="inline"/> tail\n',wiki);
		expect(count(rendered.wrapper,"p")).toBe(1);
		expect(count(rendered.wrapper,"div")).toBe(0);
		for(var pass=0; pass<3; pass++) {
			wiki.addTiddler({title: "Content", text: "<div>block</div>"});
			refresh(rendered,["Content"]);
			expect(count(rendered.wrapper,"div")).toBe(1);
			expect(count(rendered.wrapper,"p")).toBe(2);
			expect(rendered.wrapper.textContent).toContain("lead");
			expect(rendered.wrapper.textContent).toContain("tail");
			wiki.addTiddler({title: "Content", text: "words"});
			refresh(rendered,["Content"]);
			expect(count(rendered.wrapper,"p")).toBe(1);
			expect(count(rendered.wrapper,"div")).toBe(0);
		}
	});

	it("should carry a styleblock's class onto whatever replaces the paragraph", function() {
		// A styleblock decorates the paragraph the parser produced, so once that paragraph
		// is gone the author's class has to travel to what replaced it. Without this
		// @@.myClass around a block silently loses its styling
		var wiki = $tw.test.wiki();
		var overText = render("@@.myClass\njust text\n@@\n",wiki),
			overBlock = render("@@.myClass\n<div>block</div>\n@@\n",wiki);
		expect(overText.wrapper.innerHTML).toContain('class="myClass"');
		expect(overBlock.wrapper.innerHTML).toContain('class="myClass"');
	});

	it("should keep the styleblock class when the lifted node refreshes its own", function() {
		// A node lifted out of the paragraph belongs to the child that rendered it, and
		// ElementWidget.refresh re-assigns its class wholesale with setAttributeNS, which
		// replaces rather than merges. Without putting ours back the author's class is
		// silently dropped the first time the div's own class changes.
		// CHECK BY HAND: make a tiddler Dyn holding  first , and another holding
		// @@.myClass   <div class={{Dyn}}>x</div>   @@ on three lines. Inspect the div, it
		// carries both classes. Edit Dyn and inspect again, myClass must still be there
		var wiki = $tw.test.wiki();
		wiki.addTiddler({title: "Dyn", text: "first"});
		var rendered = render("@@.myClass\n<div class={{Dyn}}>x</div>\n@@\n",wiki);
		// Assert the whole attribute, not a bare substring: sending the decoration to some
		// other attribute entirely would still satisfy toContain("myClass")
		expect(rendered.wrapper.innerHTML).toContain('class="first myClass"');
		for(var pass=0; pass<3; pass++) {
			wiki.addTiddler({title: "Dyn", text: "round" + pass});
			refresh(rendered,["Dyn"]);
			expect(rendered.wrapper.innerHTML).toContain('class="round' + pass + ' myClass"');
		}
	});

	it("should carry a styleblock's style, not only its class", function() {
		// The class and style are separate branches of decorate, so a spec covering only
		// the class leaves @@color:red; around a block unguarded.
		// This proves the style is APPLIED, not that it is merged with an existing one:
		// fakedom diverts setAttribute("style",...) into a proxy and never stores it, so
		// getAttribute("style") is always undefined here and decorate's merge arm cannot be
		// reached from any spec running against fakeDocument
		var wiki = $tw.test.wiki();
		expect(render("@@color:red;\n<div>x</div>\n@@\n",wiki).wrapper.innerHTML)
			.toBe('<div style="color:red;">x</div>\n');
	});

	it("should decorate every part of a split mixed run", function() {
		// Splitting a mixed run creates NEW paragraphs either side of the block, and those
		// need the author's class as much as the block does. Otherwise @@.myClass styles
		// the middle of a run and not its ends
		var wiki = $tw.test.wiki();
		expect(render("@@.myClass\nlead <div>x</div> tail\n@@\n",wiki).wrapper.innerHTML)
			.toBe('<p class="myClass">lead </p><div class="myClass">x</div><p class="myClass"> tail\n</p>');
	});

	it("should lift out inline markup that hides a block inside it", function() {
		// A browser closes the paragraph before a <div> even when it sits inside inline
		// markup, so the detection has to recurse. Without that <p><strong><div> survives,
		// which is markup no browser will build
		var wiki = $tw.test.wiki();
		expect(render("lead ''bold <div>x</div>'' tail\n",wiki).wrapper.innerHTML)
			.toBe("<p>lead </p><strong>bold <div>x</div></strong><p> tail\n</p>");
		expect(render("lead <span>a <div>x</div> b</span> tail\n",wiki).wrapper.innerHTML)
			.toBe("<p>lead </p><span>a <div>x</div> b</span><p> tail\n</p>");
	});

	it("should not stack the styleblock class up over repeated refreshes", function() {
		// Lifted nodes are decorated again after every child refresh, so without the
		// idempotence check the class accumulates: myClass myClass myClass.
		// Three things have to hold at once for that to be reachable: the run must unwrap,
		// a child must actually refresh, and the lifted node's own class must be static so
		// nothing clears what we added. A static div sharing a run with a changing $text is
		// the smallest case that does all three
		var wiki = $tw.test.wiki();
		wiki.addTiddler({title: "Other", text: "one"});
		var rendered = render("@@.myClass\nlead <div>x</div> <$text text={{Other}}/>\n@@\n",wiki);
		for(var pass=0; pass<3; pass++) {
			wiki.addTiddler({title: "Other", text: "round" + pass});
			refresh(rendered,["Other"]);
		}
		expect(rendered.wrapper.innerHTML).toContain("round2");
		expect(rendered.wrapper.innerHTML).toContain('<div class="myClass">x</div>');
		expect(rendered.wrapper.innerHTML).not.toContain("myClass myClass");
	});

	it("should not wrap a run whose only content is metadata", function() {
		// A <style> element draws nothing wherever it sits, so a run holding only metadata
		// has not earned a paragraph. Anything else counts even when it looks empty,
		// because an attribute alone can give an element a box
		var wiki = $tw.test.wiki();
		expect(count(render("<style>.x { color: red; }</style>\n",wiki).wrapper,"p")).toBe(0);
		expect(count(render('<span style="width:1em;background-color:red"></span>\n',wiki).wrapper,"p")).toBe(1);
	});

	it("should not create a paragraph for a run that renders nothing", function() {
		// An author may still write <p/> and get an empty paragraph, which is honoured
		// rather than deleted, so this is about what the widget itself produces.
		// TWO self closing tags, because a single one followed by end of source passes the
		// html block gate and never becomes a paragraph run at all, which would leave this
		// spec unable to fail
		var wiki = $tw.test.wiki();
		wiki.addTiddler({title: "Empty", text: ""});
		var source = '<$transclude tiddler="Empty" mode="inline"/><$transclude tiddler="Empty" mode="inline"/>\n';
		expect(wiki.parseText("text/vnd.tiddlywiki",source,{parseAsInline: false}).tree[0].rule).toBe("parseblock");
		expect(count(render(source,wiki).wrapper,"p")).toBe(0);
	});

	it("should have no expectation recording a paragraph that holds a block element", function() {
		// A FIXTURE LINT, not a widget test: it reads expectation strings and renders
		// nothing, so it cannot detect a defect in the widget. What it does catch is a
		// wrong expectation, which is how 75 invalid paragraphs went unnoticed until a
		// corpus scan found them
		var closing = $tw.config.htmlParagraphClosingElements,
			offenders = [];
		$tw.utils.each($tw.wiki.filterTiddlers("[all[tiddlers+shadows]type[text/vnd.tiddlywiki-multiple]tag[$:/tags/wiki-test-spec]]"),function(title) {
			var expected = readSubTiddler(title,"ExpectedResult");
			if(expected === null) {
				return;
			}
			var match, paragraph = /<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/g;
			while((match = paragraph.exec(expected)) !== null) {
				var body = match[1];
				$tw.utils.each(closing,function(tag) {
					if(new RegExp("<" + tag + "[\\s>/]").test(body)) {
						offenders.push(title + ": paragraph contains <" + tag + ">");
					}
				});
			}
		});
		expect(offenders).toEqual([]);
	});

	// The corpus tiddlers are text/vnd.tiddlywiki-multiple, so the sub tiddler has to be
	// split out of the raw text the same way the wiki-based test runner does it
	function readSubTiddler(title,subTitle) {
		var blocks = ($tw.wiki.getTiddlerText(title) || "").split(/\r?\n\+\r?\n/mg),
			found = null;
		$tw.utils.each(blocks,function(block) {
			var split = block.indexOf("\n\n"),
				header = split === -1 ? block : block.substring(0,split),
				body = split === -1 ? "" : block.substring(split + 2);
			if(new RegExp("^title:\\s*" + $tw.utils.escapeRegExp(subTitle) + "\\s*$","m").test(header)) {
				found = body;
			}
		});
		return found;
	}

});
