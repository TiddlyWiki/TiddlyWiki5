/*\
title: $:/tests/test-edit-widgets/helpers
type: application/javascript
module-type: library

Shared test helpers for the edit-text / edit-widget test suite. Every
helper here is usable in fakedom — nothing reaches for real DOM layout,
iframe documents, or synthetic events.

Import with:

    var helpers = require("$:/tests/test-edit-widgets/helpers");

\*/

"use strict";

var widget = require("$:/core/modules/widgets/widget.js");

/*
makeWiki: build a fresh in-memory test wiki. Pass an array of tiddler
specs to seed. Use `seedTestTiddler: true` in the options to also add a
convenience "TestTiddler" (empty text) that many tests default to.
*/
exports.makeWiki = function(tiddlers,options) {
	options = options || {};
	var wiki = $tw.test.wiki();
	if(options.seedTestTiddler) {
		wiki.addTiddlers([{title: "TestTiddler", text: ""}]);
	}
	if(tiddlers) {
		wiki.addTiddlers(tiddlers);
	}
	return wiki;
};

/*
parseAndRender: parse a wikitext snippet, build the widget tree against
the fakedom, and render into a detached wrapper <div>. Returns both the
top-level widgetNode (for refresh/teardown) and the wrapper (for DOM
inspection).
*/
exports.parseAndRender = function(widgetText,wiki) {
	var parser = wiki.parseText("text/vnd.tiddlywiki",widgetText);
	var widgetNode = new widget.widget(
		{type: "widget", children: parser.tree},
		{wiki: wiki, document: $tw.fakeDocument}
	);
	$tw.fakeDocument.setSequenceNumber(0);
	var wrapper = $tw.fakeDocument.createElement("div");
	widgetNode.render(wrapper,null);
	return {widgetNode: widgetNode, wrapper: wrapper};
};

/*
findEditTextWidget: walk a widget tree and return the first
EditTextWidget instance (identified by having both an `engine` and an
`editTag` property). Needed because parseAndRender returns the
enclosing "widget" root, not the <$edit-text> itself.
*/
exports.findEditTextWidget = function findEditTextWidget(node) {
	if(node.engine && node.editTag !== undefined) {
		return node;
	}
	if(node.children) {
		for(var i = 0; i < node.children.length; i++) {
			var found = findEditTextWidget(node.children[i]);
			if(found) return found;
		}
	}
	return null;
};

/*
renderFromWikitext: parse+render a wikitext snippet and return a bundle
{ widget, root, wrapper, wiki } exposing every layer. Used by the
attribute-propagation and refresh tests which need access to the wiki
and wrapper after render.
*/
exports.renderFromWikitext = function(widgetText,wiki) {
	wiki = wiki || exports.makeWiki([{title: "TestTiddler", text: "hello"}]);
	var result = exports.parseAndRender(widgetText,wiki);
	return {
		widget: exports.findEditTextWidget(result.widgetNode),
		root: result.widgetNode,
		wrapper: result.wrapper,
		wiki: wiki
	};
};

/*
renderFromAttrs: build an <$edit-text> tag from an attrs object, render
it, and return just the EditTextWidget instance (not a full bundle).
Used by tests that only need the widget and its DOM node.
*/
exports.renderFromAttrs = function(attrs,wiki,tiddlerTitle) {
	wiki = wiki || exports.makeWiki(null,{seedTestTiddler: true});
	var attrStr = Object.keys(attrs).map(function(k) {
		return k + "=\"" + attrs[k] + "\"";
	}).join(" ");
	var text = "<$edit-text tiddler=\"" + (tiddlerTitle || "TestTiddler") + "\" " + attrStr + "/>";
	var rendered = exports.parseAndRender(text,wiki);
	return exports.findEditTextWidget(rendered.widgetNode);
};

/*
refresh: drive a widget-tree refresh cycle for a given list of changed
tiddler titles, mimicking what the core does after wiki.addTiddler.
*/
exports.refresh = function(rootWidget,wrapper,changedTitles) {
	var changed = {};
	(changedTitles || []).forEach(function(t) { changed[t] = true; });
	rootWidget.refresh(changed,wrapper,null);
};

/*
editorValue: read the editor's current text in a way that works with
fakedom. SimpleEngine seeds a textarea by appending a text-node child,
while inputs use the `value` attribute. Later updates go through
updateDomNodeText which sets `.value` on both.
*/
exports.editorValue = function(w) {
	var dn = w.engine.domNode;
	// If .value has been set explicitly, prefer it (covers refresh updates)
	if(dn.attributes && dn.attributes.value !== undefined) {
		return dn.value;
	}
	// Otherwise for textareas read the concatenated child text nodes
	if(dn.tag === "textarea" && dn.children && dn.children.length) {
		return dn.children.map(function(n) { return n.textContent || ""; }).join("");
	}
	return dn.value;
};

// Note: jasmine-specific helpers (spies) belong in the test-spec files
// themselves. TW library modules run in a sandbox that does not expose
// `jasmine`, so anything that calls jasmine.createSpy must live in a
// file tagged with $:/tags/test-spec.
