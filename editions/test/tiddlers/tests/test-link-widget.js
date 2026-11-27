/*\
title: test-link-widget.js
type: application/javascript
tags: [[$:/tags/test-spec]]

FULL CODE COVERAGE

This file and test-link-widget-adversary.js together cover every branch
of core/modules/widgets/link.js: render, renderLink, execute, refresh
and handleClickEvent. A new branch needs a new spec, here when the input
is meant to work, there when it is hostile or malformed. The adversary
file also holds the guards for issues #9976 and #9977.

Two branches are exercised but not asserted, because the test document
has no layout and no namespaces. The svg spec cannot see that the href
is written in the xlink namespace, and the click specs supply their own
getBoundingClientRect and hasAttribute. Check those in a browser.

Every spec carries the wikitext it renders, so you can replay it by
hand. Paste the snippet into a new tiddler, then press F12 and inspect
the element.

The wiki these specs render against holds:

	HelloThere		an ordinary tiddler
	Hello There		an ordinary tiddler, with a space in its title
	ShadowTiddler		supplied by a plugin, not present in the wiki itself
	OverwrittenTab		supplied by a plugin and overwritten in the wiki
	PlainTab		an ordinary tiddler carrying a tooltip field

Every place the link widget is tested:

	test-link-widget.js: this file
	test-link-widget-adversary.js: hostile and edge input
	test-widget.js: $link cleaning itself up when its children fail to render
	test-wikitext.js: a to attribute built by a macro, and its URI encoding

	data/widgets/DataAttributes/LinkWidget-DataAttributes.tid
		data and style attributes on an anchor and on a button

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

describe("Link widget", function() {

	var widget = require("$:/core/modules/widgets/widget.js");

	// Build the wiki described in the header comment. To reproduce it by
	// hand, create the ordinary tiddlers and take the two shadow ones from
	// any plugin you have installed.
	function createTestWiki() {
		var wiki = $tw.test.wiki();
		wiki.addTiddlers([
			{title: "HelloThere", text: "Welcome"},
			{title: "Hello There", text: "Welcome"},
			{title: "PlainTab", tooltip: "A plain tooltip", text: "Welcome"},
			{title: "OverwrittenTab", text: "The version in the wiki"},
			{
				title: "$:/plugins/tiddlywiki/test",
				type: "application/json",
				"plugin-type": "plugin",
				text: JSON.stringify({tiddlers: {
					"ShadowTiddler": {title: "ShadowTiddler", text: "From the plugin"},
					"OverwrittenTab": {title: "OverwrittenTab", text: "From the plugin"}
				}})
			}
		]);
		wiki.readPluginInfo();
		wiki.registerPluginTiddlers("plugin");
		wiki.unpackPluginTiddlers();
		return wiki;
	}

	// Build the widget tree for a piece of wikitext, the way a tiddler body
	// is built. Most specs go through renderText below and never need this.
	function makeWidget(wiki,text) {
		var parser = wiki.parseText("text/vnd.tiddlywiki",text,{});
		return new widget.widget({type: "widget", children: parser.tree},{
			wiki: wiki,
			document: $tw.fakeDocument
		});
	}

	function renderWidget(widgetNode) {
		$tw.fakeDocument.setSequenceNumber(0);
		var wrapper = $tw.fakeDocument.createElement("div");
		widgetNode.render(wrapper,null);
		return wrapper;
	}

	// Render wikitext and hand back the HTML, so a spec can assert on the
	// generated element
	function renderText(wiki,text) {
		return renderWidget(makeWidget(wiki,text)).innerHTML;
	}

	// The click handler reads two things from the DOM node that the test
	// document does not provide: the position of the link, so the navigation
	// can animate from it, and hasAttribute. Supply both, faithfully to what
	// a browser would return.
	function stubClickDependencies(domNode) {
		domNode.getBoundingClientRect = function() {
			return {top: 1, left: 2, width: 3, right: 5, bottom: 4, height: 3};
		};
		domNode.hasAttribute = function(name) {
			return $tw.utils.hop(this.attributes,name);
		};
	}

	// Find the link widget inside a rendered tree. Only the click specs need
	// the widget itself rather than the HTML it produced.
	function findLinkWidget(widgetNode) {
		if(widgetNode.parseTreeNode && widgetNode.parseTreeNode.tag === "$link") {
			return widgetNode;
		}
		for(var t=0; t<(widgetNode.children || []).length; t++) {
			var found = findLinkWidget(widgetNode.children[t]);
			if(found) {
				return found;
			}
		}
		return null;
	}

	/* The element and its classes */

	it("should render an anchor element with the link classes", function() {
		// <$link to="HelloThere">Link</$link>
		var html = renderText(createTestWiki(),'<$link to="HelloThere">Link</$link>');
		expect(html).toBe('<p><a class="tc-tiddlylink tc-tiddlylink-resolves" href="#HelloThere">Link</a></p>');
	});

	it("should mark a link to a tiddler that does not exist", function() {
		// <$link to="NotHere">Link</$link>
		var html = renderText(createTestWiki(),'<$link to="NotHere">Link</$link>');
		expect(html).toContain('class="tc-tiddlylink tc-tiddlylink-missing"');
	});

	it("should mark a link to a shadow tiddler", function() {
		// A shadow tiddler is one supplied by a plugin. It does not exist in
		// the wiki itself, so it is both shadow and missing, and only the
		// shadow class is applied.
		// <$link to="ShadowTiddler">Link</$link>
		var html = renderText(createTestWiki(),'<$link to="ShadowTiddler">Link</$link>');
		expect(html).toContain('class="tc-tiddlylink tc-tiddlylink-shadow"');
	});

	it("should mark a link to an overwritten shadow tiddler", function() {
		// Here the plugin supplies the tiddler and the wiki overrides it, so
		// the link both resolves and is shadow.
		// <$link to="OverwrittenTab">Link</$link>
		var html = renderText(createTestWiki(),'<$link to="OverwrittenTab">Link</$link>');
		expect(html).toContain('class="tc-tiddlylink tc-tiddlylink-shadow tc-tiddlylink-resolves"');
	});

	it("should add the class attribute to the default classes", function() {
		// <$link to="HelloThere" class="example">Link</$link>
		var html = renderText(createTestWiki(),'<$link to="HelloThere" class="example">Link</$link>');
		expect(html).toContain('class="tc-tiddlylink tc-tiddlylink-resolves example"');
	});

	it("should replace the default classes with overrideClass", function() {
		// <$link to="HelloThere" overrideClass="example">Link</$link>
		var html = renderText(createTestWiki(),'<$link to="HelloThere" overrideClass="example">Link</$link>');
		expect(html).toContain('class="example"');
		expect(html).not.toContain("tc-tiddlylink");
	});

	it("should set no class at all for an empty overrideClass", function() {
		// <$link to="HelloThere" overrideClass="">Link</$link>
		var html = renderText(createTestWiki(),'<$link to="HelloThere" overrideClass="">Link</$link>');
		expect(html).toBe('<p><a href="#HelloThere">Link</a></p>');
	});

	/* The href */

	it("should URI encode the target title into the href", function() {
		// <$link to="Hello There">Link</$link>
		var html = renderText(createTestWiki(),'<$link to="Hello There">Link</$link>');
		expect(html).toContain('href="#Hello%20There"');
	});

	it("should build the href from tv-wikilink-template", function() {
		// <$let tv-wikilink-template="/read/$uri_encoded$">
		// <$link to="Hello There">Link</$link>
		// </$let>
		var html = renderText(createTestWiki(),
			'<$let tv-wikilink-template="/read/$uri_encoded$"><$link to="Hello There">Link</$link></$let>');
		expect(html).toContain('href="/read/Hello%20There"');
	});

	it("should build the href from tv-filter-export-link", function() {
		// The filter runs with the target tiddler as its input, so addprefix
		// and addsuffix can build any href you like.
		// <$let tv-filter-export-link="[addprefix[/static/]addsuffix[.html]]">
		// <$link to="HelloThere">Link</$link>
		// </$let>
		var html = renderText(createTestWiki(),
			'<$let tv-filter-export-link="[addprefix[/static/]addsuffix[.html]]"><$link to="HelloThere">Link</$link></$let>');
		expect(html).toContain('href="/static/HelloThere.html"');
	});

	it("should let tv-get-export-link override the href", function() {
		// tv-get-export-link wins over both of the above. It receives the
		// target title in the to parameter.
		// \define tv-get-export-link(to)
		// /exported/$to$
		// \end
		// <$link to="HelloThere">Link</$link>
		var html = renderText(createTestWiki(),`\\define tv-get-export-link(to)
/exported/$to$
\\end
<$link to="HelloThere">Link</$link>`);
		expect(html).toContain('href="/exported/HelloThere"');
	});

	it("should let tv-filter-export-link win over tv-wikilink-template", function() {
		// Both are set, and the filter is the one that counts.
		// <$let tv-wikilink-template="/tpl/$uri_encoded$" tv-filter-export-link="[addprefix[/flt/]]">
		// <$link to="HelloThere">Link</$link>
		// </$let>
		var html = renderText(createTestWiki(),
			'<$let tv-wikilink-template="/tpl/$uri_encoded$" tv-filter-export-link="[addprefix[/flt/]]"><$link to="HelloThere">Link</$link></$let>');
		expect(html).toContain('href="/flt/HelloThere"');
	});

	it("should let tv-get-export-link win over both of the others", function() {
		// All three are set. tv-get-export-link is applied last and wins.
		// \define tv-get-export-link(to)
		// /get/$to$
		// \end
		// <$let tv-wikilink-template="/tpl/$uri_encoded$" tv-filter-export-link="[addprefix[/flt/]]">
		// <$link to="HelloThere">Link</$link>
		// </$let>
		var html = renderText(createTestWiki(),`\\define tv-get-export-link(to)
/get/$to$
\\end
<$let tv-wikilink-template="/tpl/$uri_encoded$" tv-filter-export-link="[addprefix[/flt/]]"><$link to="HelloThere">Link</$link></$let>`);
		expect(html).toContain('href="/get/HelloThere"');
	});

	/* The tooltip. See also issue #9976 in the adversary suite */

	it("should use the tooltip attribute as the title", function() {
		// Hover the link to see it.
		// <$link to="HelloThere" tooltip="Custom tooltip">Link</$link>
		var html = renderText(createTestWiki(),'<$link to="HelloThere" tooltip="Custom tooltip">Link</$link>');
		expect(html).toContain('title="Custom tooltip"');
	});

	it("should use tv-wikilink-tooltip when there is no tooltip attribute", function() {
		// <$let tv-wikilink-tooltip="From the variable">
		// <$link to="HelloThere">Link</$link>
		// </$let>
		var html = renderText(createTestWiki(),
			'<$let tv-wikilink-tooltip="From the variable"><$link to="HelloThere">Link</$link></$let>');
		expect(html).toContain('title="From the variable"');
	});

	it("should prefer the tooltip attribute over tv-wikilink-tooltip", function() {
		// <$let tv-wikilink-tooltip="From the variable">
		// <$link to="HelloThere" tooltip="From the attribute">Link</$link>
		// </$let>
		var html = renderText(createTestWiki(),
			'<$let tv-wikilink-tooltip="From the variable"><$link to="HelloThere" tooltip="From the attribute">Link</$link></$let>');
		expect(html).toContain('title="From the attribute"');
	});

	it("should render the tooltip with the target as the current tiddler", function() {
		// This is what makes the documented tooltip convention work. Inside
		// the tooltip, currentTiddler is the link target, not the tiddler
		// holding the link.
		// <$let tv-wikilink-tooltip="Tooltip of <$text text={{!!title}}/>">
		// <$link to="PlainTab">Link</$link>
		// </$let>
		var html = renderText(createTestWiki(),
			'<$let tv-wikilink-tooltip="Tooltip of <$text text={{!!title}}/>"><$link to="PlainTab">Link</$link></$let>');
		expect(html).toContain('title="Tooltip of PlainTab"');
	});

	it("should render the documented tooltip convention", function() {
		// The convention documented in the LinkWidget tiddler: the tooltip
		// field of the target, falling back to its title.
		// \procedure tv-wikilink-tooltip()
		// <$let tv-wikilinks="no"><$transclude $field="tooltip"><$transclude $field="title"/></$transclude></$let>
		// \end
		// <$link to="PlainTab">Link</$link>
		var macro = `\\procedure tv-wikilink-tooltip()
<$let tv-wikilinks="no"><$transclude $field="tooltip"><$transclude $field="title"/></$transclude></$let>
\\end
`;
		var wiki = createTestWiki();
		expect(renderText(wiki,macro + '<$link to="PlainTab">Link</$link>')).toContain('title="A plain tooltip"');
		// HelloThere has no tooltip field, so the title is used instead
		expect(renderText(wiki,macro + '<$link to="HelloThere">Link</$link>')).toContain('title="HelloThere"');
	});

	it("should set no title attribute when there is no tooltip", function() {
		// <$link to="HelloThere">Link</$link>
		var html = renderText(createTestWiki(),'<$link to="HelloThere">Link</$link>');
		expect(html).not.toContain("title=");
	});

	/* The remaining attributes */

	it("should set the tabindex attribute", function() {
		// <$link to="HelloThere" tabindex="-1">Link</$link>
		var html = renderText(createTestWiki(),'<$link to="HelloThere" tabindex="-1">Link</$link>');
		expect(html).toContain('tabindex="-1"');
	});

	it("should set the role attribute", function() {
		// <$link to="HelloThere" role="button">Link</$link>
		var html = renderText(createTestWiki(),'<$link to="HelloThere" role="button">Link</$link>');
		expect(html).toContain('role="button"');
	});

	it("should pass through aria- attributes", function() {
		// <$link to="HelloThere" aria-label="Go home" aria-current="page">Link</$link>
		var html = renderText(createTestWiki(),'<$link to="HelloThere" aria-label="Go home" aria-current="page">Link</$link>');
		expect(html).toContain('aria-label="Go home"');
		expect(html).toContain('aria-current="page"');
	});

	it("should pass through data- attributes to the span form of a link", function() {
		// The anchor form is already covered by the Widgets/DataAttributes
		// wiki test spec. This is the other branch, where the widget renders
		// a span because links are switched off.
		// <$let tv-wikilinks="no">
		// <$link to="HelloThere" data-foo="bar" aria-label="Home">Link</$link>
		// </$let>
		var html = renderText(createTestWiki(),
			'<$let tv-wikilinks="no"><$link to="HelloThere" data-foo="bar" aria-label="Home">Link</$link></$let>');
		expect(html).toContain('data-foo="bar"');
		expect(html).toContain('aria-label="Home"');
	});

	it("should render a different element for the tag attribute", function() {
		// <$link to="HelloThere" tag="span">Link</$link>
		var html = renderText(createTestWiki(),'<$link to="HelloThere" tag="span">Link</$link>');
		expect(html).toContain("<span");
		// Only anchor elements get an href
		expect(html).not.toContain("href=");
	});

	it("should mark a link as not draggable", function() {
		// Anchor elements are draggable in the browser already, so the widget
		// only writes the attribute to turn dragging off.
		// <$link to="HelloThere" draggable="no">Link</$link>
		var html = renderText(createTestWiki(),'<$link to="HelloThere" draggable="no">Link</$link>');
		expect(html).toContain('draggable="false"');
	});

	/* Content and defaults */

	it("should default the target to the current tiddler", function() {
		// Open PlainTab and put this in its body. The link points back at
		// the tiddler it sits in.
		// <$link>Link</$link>
		var html = renderText(createTestWiki(),'<$tiddler tiddler="PlainTab"><$link>Link</$link></$tiddler>');
		expect(html).toContain('href="#PlainTab"');
	});

	it("should default the link text to the target title", function() {
		// <$link to="HelloThere"/>
		var html = renderText(createTestWiki(),'<$link to="HelloThere"/>');
		expect(html).toBe('<p><a class="tc-tiddlylink tc-tiddlylink-resolves" href="#HelloThere">HelloThere</a></p>');
	});

	/* Turning links off */

	it("should render a span instead of a link when tv-wikilinks is no", function() {
		// Used by print and export templates, where a link is pointless.
		// <$let tv-wikilinks="no">
		// <$link to="HelloThere">Link</$link>
		// </$let>
		var html = renderText(createTestWiki(),
			'<$let tv-wikilinks="no"><$link to="HelloThere">Link</$link></$let>');
		expect(html).toBe("<p><span>Link</span></p>");
	});

	it("should hide a missing link when tv-show-missing-links is no", function() {
		// The text stays, the link goes.
		// <$let tv-show-missing-links="no">
		// <$link to="NotHere">Link</$link>
		// </$let>
		var html = renderText(createTestWiki(),
			'<$let tv-show-missing-links="no"><$link to="NotHere">Link</$link></$let>');
		expect(html).toBe("<p><span>Link</span></p>");
	});

	it("should still show an existing link when tv-show-missing-links is no", function() {
		// <$let tv-show-missing-links="no">
		// <$link to="HelloThere">Link</$link>
		// </$let>
		var html = renderText(createTestWiki(),
			'<$let tv-show-missing-links="no"><$link to="HelloThere">Link</$link></$let>');
		expect(html).toContain("<a ");
	});

	it("should still show a shadow link when tv-show-missing-links is no", function() {
		// A shadow tiddler does not exist in the wiki, so it counts as
		// missing. Hiding it would hide most of the core documentation, so
		// the widget keeps the link.
		// <$let tv-show-missing-links="no">
		// <$link to="ShadowTiddler">Link</$link>
		// </$let>
		var html = renderText(createTestWiki(),
			'<$let tv-show-missing-links="no"><$link to="ShadowTiddler">Link</$link></$let>');
		expect(html).toContain('class="tc-tiddlylink tc-tiddlylink-shadow"');
	});

	/* Namespaces, refreshing and navigation */

	it("should render a link inside an svg element", function() {
		// Inside svg the href has to be written in the xlink namespace, or
		// the link does nothing in the browser. The test document does not
		// model namespaces, so this spec only shows that the branch runs and
		// still produces the href. Check the namespace by hand in F12.
		// <svg><$link to="HelloThere">Link</$link></svg>
		var html = renderText(createTestWiki(),'<svg><$link to="HelloThere">Link</$link></svg>');
		expect(html).toContain('<svg><a class="tc-tiddlylink tc-tiddlylink-resolves" href="#HelloThere">');
	});

	it("should restyle itself when the target tiddler is created", function() {
		// By hand: put a link to a tiddler that does not exist in a tiddler,
		// then create the target. The link turns from missing to resolved
		// without a reload.
		// <$link to="NotYet">Link</$link>
		var wiki = createTestWiki(),
			widgetNode = makeWidget(wiki,'<$link to="NotYet">Link</$link>'),
			wrapper = renderWidget(widgetNode);
		expect(wrapper.innerHTML).toContain("tc-tiddlylink-missing");
		wiki.addTiddler({title: "NotYet", text: "Here now"});
		widgetNode.refresh({NotYet: true},wrapper,null);
		expect(wrapper.innerHTML).toContain("tc-tiddlylink-resolves");
	});

	it("should send a navigate message when the link is clicked", function() {
		// By hand: click the link and the target opens in the story river.
		// <$link to="HelloThere">Link</$link>
		var wiki = createTestWiki(),
			widgetNode = makeWidget(wiki,'<$link to="HelloThere">Link</$link>'),
			messages = [];
		// Catch the message where it would otherwise leave the widget tree
		widgetNode.dispatchEvent = function(event) {
			messages.push(event);
			return true;
		};
		var wrapper = renderWidget(widgetNode),
			linkWidget = findLinkWidget(widgetNode);
		// The handler reads the link position so the navigation can animate
		// from it, and the test document has no layout to read
		stubClickDependencies(linkWidget.domNodes[0]);
		linkWidget.handleClickEvent({
			metaKey: false,
			ctrlKey: false,
			altKey: false,
			shiftKey: false,
			button: 0,
			preventDefault: function() {},
			stopPropagation: function() {}
		});
		expect(messages.length).toBe(1);
		expect(messages[0].type).toBe("tm-navigate");
		expect(messages[0].navigateTo).toBe("HelloThere");
		// A plain click navigates, so the browser must not follow the href
		expect(messages[0].navigateSuppressNavigation).toBe(false);
		expect(wrapper.innerHTML).toContain('href="#HelloThere"');
	});

	it("should suppress navigation for a ctrl click", function() {
		// By hand: ctrl click, or middle click, and the browser opens the
		// href in a new tab instead of the story river opening the tiddler.
		// <$link to="HelloThere">Link</$link>
		var wiki = createTestWiki(),
			widgetNode = makeWidget(wiki,'<$link to="HelloThere">Link</$link>'),
			messages = [];
		widgetNode.dispatchEvent = function(event) {
			messages.push(event);
			return true;
		};
		renderWidget(widgetNode);
		var linkWidget = findLinkWidget(widgetNode);
		stubClickDependencies(linkWidget.domNodes[0]);
		linkWidget.handleClickEvent({
			metaKey: false,
			ctrlKey: true,
			altKey: false,
			shiftKey: false,
			button: 0,
			preventDefault: function() {},
			stopPropagation: function() {}
		});
		expect(messages[0].navigateSuppressNavigation).toBe(true);
	});

});
