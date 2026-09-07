/*\
title: test-link-widget-adversary.js
type: application/javascript
tags: [[$:/tags/test-spec]]

FULL CODE COVERAGE

This file and test-link-widget.js together cover every branch of
core/modules/widgets/link.js. Add a spec here when a new branch handles
input an author got wrong or an attacker chose, and one in
test-link-widget.js when it handles input meant to work.

Every spec carries the wikitext it renders, so you can replay it by hand.
Paste the snippet into a new tiddler, then press F12 and inspect the
generated element.

The tooltip specs guard issue #9976. Before the fix, a tooltip that
rendered a wikilink made the nested link render the same tooltip again,
so the loop only ended when the widget tree depth limit tripped. The
tooltip then read "Recursive transclusion error in transclude widget", or
the whole rendering failed where no ancestor transclusion was there to
catch the error. Hover the links in those specs to check by hand.

CamelCase links are off in the core defaults and on in tw5.com, which is
why the two specs that need them switch the parser rule on for their own
duration.

The two tv-filter-export-link specs guard issue #9977, where a filter that
matched nothing put the string undefined into the href.

Every place the link widget is tested:

	test-link-widget-adversary.js: this file
	test-link-widget.js: ordinary behaviour
	test-widget.js: $link cleaning itself up when its children fail to render
	test-wikitext.js: a to attribute built by a macro, and its URI encoding

	data/widgets/DataAttributes/LinkWidget-DataAttributes.tid
		data and style attributes on an anchor and on a button

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

describe("Link widget adversary", function() {

	var widget = require("$:/core/modules/widgets/widget.js"),
		WikiParser = require("$:/core/modules/parsers/wikiparser/wikiparser.js")["text/vnd.tiddlywiki"];

	var RECURSION_ESCAPED = "the recursion guard threw out of the render";

	// The tooltip convention documented in the LinkWidget tiddler, written
	// the naive way, with no guard against the tooltip generating links
	var TOOLTIP_MACRO_NAIVE = `\\define tv-wikilink-tooltip()
<$transclude field="tooltip"><$transclude field="title"/></$transclude>
\\end
`;

	function createTestWiki() {
		var wiki = $tw.test.wiki();
		wiki.addTiddlers([
			{title: "HelloThere", text: "Welcome"},
			{title: "Community", text: "Welcome"},
			// A tooltip that is itself a link, which is what used to loop
			{title: "LinkingTab", tooltip: "See [[Community]] now", text: "Welcome"},
			{title: "Blurb", text: "See [[Community]] now"}
		]);
		return wiki;
	}

	function renderText(wiki,text) {
		var parser = wiki.parseText("text/vnd.tiddlywiki",text,{}),
			widgetNode = new widget.widget({type: "widget", children: parser.tree},{
				wiki: wiki,
				document: $tw.fakeDocument
			});
		$tw.fakeDocument.setSequenceNumber(0);
		var wrapper = $tw.fakeDocument.createElement("div");
		try {
			widgetNode.render(wrapper,null);
		} catch(err) {
			// TranscludeRecursionError carries no message, so Jasmine cannot
			// format it. Report it as a value the expectation can name.
			if(err instanceof $tw.utils.TranscludeRecursionError) {
				return RECURSION_ESCAPED;
			}
			throw err;
		}
		return wrapper.innerHTML;
	}

	// The parser caches its rule classes on the WikiParser prototype, so the
	// tooltip that the widget renders internally cannot be given a rule set
	// of its own. Rebuild the cache from a wiki that enables CamelCase
	// links, then rebuild it from the shared wiki so later specs are
	// unaffected. To do the same by hand, set
	// $:/config/WikiParserRules/Inline/wikilink to enable.
	function withCamelCaseLinks(wiki,callback) {
		wiki.addTiddler({title: "$:/config/WikiParserRules/Inline/wikilink", text: "enable"});
		delete WikiParser.prototype.inlineRuleClasses;
		try {
			return callback();
		} finally{
			delete WikiParser.prototype.inlineRuleClasses;
			$tw.wiki.parseText("text/vnd.tiddlywiki","");
		}
	}

	/* Tooltips that render links. Issue #9976 */

	it("should render a tooltip containing an explicit link", function() {
		// Hover the link. The tooltip should read "See Community now".
		// <$let tv-wikilink-tooltip="See [[Community]] now">
		// <$link to="Community">Link</$link>
		// </$let>
		var html = renderText(createTestWiki(),
			'<$let tv-wikilink-tooltip="See [[Community]] now"><$link to="Community">Link</$link></$let>');
		expect(html).toContain('title="See Community now"');
	});

	it("should render a tooltip transcluded from a tiddler containing a link", function() {
		// Same as above, except the tooltip text arrives through a
		// transclusion, so the recursion guard has a transclude widget to
		// stop at and the tooltip used to read the error message instead.
		// <$let tv-wikilink-tooltip="{{Blurb}}">
		// <$link to="Community">Link</$link>
		// </$let>
		var html = renderText(createTestWiki(),
			'<$let tv-wikilink-tooltip="{{Blurb}}"><$link to="Community">Link</$link></$let>');
		expect(html).toContain('title="See Community now"');
	});

	it("should render a tooltip field containing a link", function() {
		// LinkingTab carries tooltip: See [[Community]] now
		// \define tv-wikilink-tooltip()
		// <$transclude field="tooltip"><$transclude field="title"/></$transclude>
		// \end
		// <$link to="LinkingTab">Link</$link>
		var html = renderText(createTestWiki(),TOOLTIP_MACRO_NAIVE + '<$link to="LinkingTab">Link</$link>');
		expect(html).toContain('title="See Community now"');
	});

	it("should render the tooltip example documented in LinkWidget", function() {
		// This is the example that reported the bug. It needs CamelCase
		// links, because the tooltip text is the target title HelloThere.
		// <$let tv-wikilink-tooltip="I'm a link to {{!!title}}">
		// <$link to="HelloThere">Link 2</$link>
		// </$let>
		var wiki = createTestWiki();
		var html = withCamelCaseLinks(wiki,function() {
			return renderText(wiki,`<$let tv-wikilink-tooltip="I'm a link to {{!!title}}">
<$link to="HelloThere">Link 2</$link>
</$let>`);
		});
		// The only escapes in these specs. This one string holds both an
		// apostrophe and double quotes, so no quoting choice avoids them.
		expect(html).toContain("title=\"I'm a link to HelloThere\"");
	});

	it("should render the tooltip convention documented in LinkWidget", function() {
		// HelloThere has no tooltip field, so the convention falls back to
		// the title, which is a CamelCase link.
		// \define tv-wikilink-tooltip()
		// <$transclude field="tooltip"><$transclude field="title"/></$transclude>
		// \end
		// <$link to="HelloThere">Link</$link>
		var wiki = createTestWiki();
		var html = withCamelCaseLinks(wiki,function() {
			return renderText(wiki,TOOLTIP_MACRO_NAIVE + '<$link to="HelloThere">Link</$link>');
		});
		expect(html).toContain('title="HelloThere"');
	});

	it("should not inherit a tooltip attribute into a nested link", function() {
		// An attribute is not a variable, so this case never looped. It is
		// here to keep the difference visible.
		// <$link to="Community" tooltip="See [[Community]] now">Link</$link>
		var html = renderText(createTestWiki(),
			'<$link to="Community" tooltip="See [[Community]] now">Link</$link>');
		expect(html).toContain('title="See Community now"');
	});

	it("should set no title attribute for an empty tooltip", function() {
		// <$link to="Community" tooltip="">Link</$link>
		var html = renderText(createTestWiki(),'<$link to="Community" tooltip="">Link</$link>');
		expect(html).not.toContain("title=");
	});

	/* Hostile and malformed markup */

	it("should not render an unsafe element for the tag attribute", function() {
		// script is in $tw.config.htmlUnsafeElements, so the widget falls
		// back to an anchor rather than writing a script tag into the page.
		// <$link to="Community" tag="script">Link</$link>
		var html = renderText(createTestWiki(),'<$link to="Community" tag="script">Link</$link>');
		expect(html).not.toContain("<script");
		expect(html).toContain("<a ");
	});

	it("should not let a javascript URL out of the href", function() {
		// A tiddler title is untrusted, so a title that looks like a
		// javascript URL must not become one. The href is always a fragment,
		// and the colon and the brackets are encoded.
		// <$link to="javascript:alert(1)">Link</$link>
		var html = renderText(createTestWiki(),'<$link to="javascript:alert(1)">Link</$link>');
		expect(html).toContain('href="#javascript%3Aalert%281%29"');
	});

	it("should encode a title that would otherwise break out of the href", function() {
		// <$link to={{{ [[a"b]] }}}>Link</$link>
		var html = renderText(createTestWiki(),'<$link to={{{ [[a"b]] }}}>Link</$link>');
		expect(html).toContain('href="#a%22b"');
		expect(html).not.toContain('#a"b');
	});

	it("should encode a title carrying URL punctuation", function() {
		// A title is not a path, so every reserved character has to survive
		// the round trip.
		// <$link to="Q&A #1 50% done?">Link</$link>
		var html = renderText(createTestWiki(),'<$link to="Q&A #1 50% done?">Link</$link>');
		expect(html).toContain('href="#Q%26A%20%231%2050%25%20done%3F"');
	});

	it("should handle an empty target title", function() {
		// <$link to="">Link</$link>
		var html = renderText(createTestWiki(),'<$link to="">Link</$link>');
		expect(html).toContain('class="tc-tiddlylink tc-tiddlylink-missing"');
		expect(html).toContain('href="#"');
	});

	/* Values that look like the ones the widget acts on, but are not */

	it("should ignore surrounding whitespace in tv-wikilinks", function() {
		// The widget trims the value before comparing it.
		// <$let tv-wikilinks="  no  ">
		// <$link to="Community">Link</$link>
		// </$let>
		var html = renderText(createTestWiki(),
			'<$let tv-wikilinks="  no  "><$link to="Community">Link</$link></$let>');
		expect(html).toBe("<p><span>Link</span></p>");
	});

	it("should treat any other tv-wikilinks value as yes", function() {
		// Only the exact word no switches links off, so a capitalised value
		// leaves the link in place.
		// <$let tv-wikilinks="No">
		// <$link to="Community">Link</$link>
		// </$let>
		var html = renderText(createTestWiki(),
			'<$let tv-wikilinks="No"><$link to="Community">Link</$link></$let>');
		expect(html).toContain("<a ");
	});

	it("should ignore a draggable value that is neither yes nor no", function() {
		// <$link to="Community" draggable="maybe">Link</$link>
		var html = renderText(createTestWiki(),'<$link to="Community" draggable="maybe">Link</$link>');
		expect(html).not.toContain("draggable=");
	});

	it("should make a non anchor element explicitly draggable", function() {
		// An anchor is draggable in the browser already. Any other element
		// has to be told, or dragging a link out of a button would do
		// nothing.
		// <$link to="Community" tag="button">Link</$link>
		var html = renderText(createTestWiki(),'<$link to="Community" tag="button">Link</$link>');
		expect(html).toContain('draggable="true"');
	});

	it("should let overrideClass win over class", function() {
		// <$link to="Community" class="added" overrideClass="only">Link</$link>
		var html = renderText(createTestWiki(),
			'<$link to="Community" class="added" overrideClass="only">Link</$link>');
		expect(html).toContain('class="only"');
		expect(html).not.toContain("added");
	});

	it("should use a tv-wikilink-template that carries no placeholder", function() {
		// Every link then points at the same place, which is odd but is what
		// the template says.
		// <$let tv-wikilink-template="/fixed">
		// <$link to="Community">Link</$link>
		// </$let>
		var html = renderText(createTestWiki(),
			'<$let tv-wikilink-template="/fixed"><$link to="Community">Link</$link></$let>');
		expect(html).toContain('href="/fixed"');
	});

	/* The href built from a filter. Issue #9977 */

	it("should use an empty tv-filter-export-link result as an empty href", function() {
		// A filter that deliberately produces an empty string is an author
		// saying the link has no destination. This is the case that must
		// survive the fix for #9977.
		// <$let tv-filter-export-link="[[]]">
		// <$link to="Community">Link</$link>
		// </$let>
		var html = renderText(createTestWiki(),
			'<$let tv-filter-export-link="[[]]"><$link to="Community">Link</$link></$let>');
		expect(html).toContain('href=""');
	});

	// Issue #9977. The filter returns no result at all, so
	// filterTiddlers(...)[0] used to hand undefined to setAttributeNS, and
	// the browser got href="undefined", a link to a relative path called
	// undefined. Note the difference from the spec above: a filter that
	// returns an empty string is an author asking for an empty href, and
	// that is still honoured.
	it("should fall back to the default href when tv-filter-export-link matches nothing", function() {
		// <$let tv-filter-export-link="[tag[nope]]">
		// <$link to="Community">Link</$link>
		// </$let>
		var html = renderText(createTestWiki(),
			'<$let tv-filter-export-link="[tag[nope]]"><$link to="Community">Link</$link></$let>');
		expect(html).not.toContain('href="undefined"');
		expect(html).toContain('href="#Community"');
	});

	it("should double encode a title for $uri_doubleencoded$", function() {
		// Used where the href passes through a second decoding step, for
		// example a query string.
		// <$let tv-wikilink-template="/go?t=$uri_doubleencoded$">
		// <$link to="Hello There">Link</$link>
		// </$let>
		var html = renderText(createTestWiki(),
			'<$let tv-wikilink-template="/go?t=$uri_doubleencoded$"><$link to="Hello There">Link</$link></$let>');
		expect(html).toContain('href="/go?t=Hello%2520There"');
	});

	it("should render a link inside the content of another link", function() {
		// Nested anchors are invalid HTML, but the widget has no say in what
		// an author writes, and it must not lose the content.
		// <$link to="Community">outer <$link to="HelloThere">inner</$link></$link>
		var html = renderText(createTestWiki(),
			'<$link to="Community">outer <$link to="HelloThere">inner</$link></$link>');
		expect(html).toContain('href="#Community"');
		expect(html).toContain('href="#HelloThere"');
		expect(html).toContain("inner");
	});

});
