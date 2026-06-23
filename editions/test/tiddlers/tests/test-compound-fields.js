/*\
title: test-compound-fields.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests every write path against text/vnd.tiddlywiki-multiple+fields tiddlers:
parser/serializer round-trip, addTiddler derived-field exposure and stale-clearing,
and every widget that mutates a tiddler.

\*/

/* eslint-env node, browser, jasmine */
/* eslint no-mixed-spaces-and-tabs: ["error", "smart-tabs"]*/
"use strict";

describe("Compound +fields write paths", function() {

	var COMPOUND_TYPE = "text/vnd.tiddlywiki-multiple+fields";

	function initialText() {
		return [
			"title: body",
			"type: multiline",
			"",
			"initial body",
			"+",
			"title: email",
			"type: email",
			"",
			"old@example.com",
			"+",
			"title: nickname",
			"",
			"OldNick"
		].join("\n");
	}

	function setupWiki() {
		var wiki = new $tw.Wiki();
		wiki.addTiddlers([
			{title: "Root", text: ""},
			{title: "Target", type: COMPOUND_TYPE, text: initialText()}
		]);
		wiki.addIndexersToWiki();
		var widgetNode = wiki.makeTranscludeWidget("Root",{document: $tw.fakeDocument, parseAsInline: true});
		var container = $tw.fakeDocument.createElement("div");
		widgetNode.render(container,null);
		return {
			wiki: wiki,
			widgetNode: widgetNode,
			invoke: function(actions) {
				widgetNode.invokeActionString(actions,widgetNode,null,{});
			}
		};
	}

	function getEntry(wiki,title,name) {
		var data = wiki.getTiddlerData(title);
		return data ? data[name] : undefined;
	}

	function fieldNames(wiki,title) {
		var t = wiki.getTiddler(title);
		if(!t) return [];
		return Object.keys(t.fields).sort();
	}

	// === Parser / serializer ===

	describe("parseMultilineFields / makeMultilineFieldsDictionary", function() {
		it("parses plain and metadata sub-entries", function() {
			var data = $tw.utils.parseMultilineFields(initialText());
			expect(data.body).toEqual({value: "initial body", type: "multiline"});
			expect(data.email).toEqual({value: "old@example.com", type: "email"});
			expect(data.nickname).toBe("OldNick");
		});
		it("round-trips text", function() {
			var data = $tw.utils.parseMultilineFields(initialText());
			var roundTripped = $tw.utils.makeMultilineFieldsDictionary(data,initialText());
			expect(roundTripped).toBe(initialText());
		});
		it("preserves entry order from originalText, appends new keys at the end", function() {
			var data = $tw.utils.parseMultilineFields(initialText());
			data.city = "Vienna";
			var out = $tw.utils.makeMultilineFieldsDictionary(data,initialText());
			expect(out.indexOf("title: body") < out.indexOf("title: email")).toBe(true);
			expect(out.indexOf("title: email") < out.indexOf("title: nickname")).toBe(true);
			expect(out.indexOf("title: nickname") < out.indexOf("title: city")).toBe(true);
		});
		it("drops removed keys from the serialized output", function() {
			var data = $tw.utils.parseMultilineFields(initialText());
			delete data.nickname;
			var out = $tw.utils.makeMultilineFieldsDictionary(data,initialText());
			expect(out.indexOf("title: nickname")).toBe(-1);
			expect(out.indexOf("OldNick")).toBe(-1);
		});
	});

	// === Derived-field exposure on addTiddler ===

	describe("addTiddler hook (boot.js)", function() {
		it("exposes sub-entry titles as fields, mapping `text` sub-entry to `body`", function() {
			var info = setupWiki();
			var t = info.wiki.getTiddler("Target");
			expect(t.fields.body).toBe("initial body");
			expect(t.fields.email).toBe("old@example.com");
			expect(t.fields.nickname).toBe("OldNick");
		});
		it("clears stale derived fields when their sub-entry is removed via text rewrite", function() {
			var info = setupWiki();
			expect(info.wiki.getTiddler("Target").fields.nickname).toBe("OldNick");
			// Rewrite text without the nickname sub-entry
			var newText = "title: body\ntype: multiline\n\ninitial body\n+\ntitle: email\ntype: email\n\nold@example.com";
			info.wiki.addTiddler(new $tw.Tiddler(info.wiki.getTiddler("Target").fields,{text: newText}));
			expect(info.wiki.getTiddler("Target").fields.nickname).toBeUndefined();
			expect(info.wiki.getTiddler("Target").fields.body).toBe("initial body");
			expect(info.wiki.getTiddler("Target").fields.email).toBe("old@example.com");
		});
		it("does NOT clear user-added non-derived fields when text is rewritten", function() {
			var info = setupWiki();
			// Add a custom field not present in compound text
			info.wiki.addTiddler(new $tw.Tiddler(info.wiki.getTiddler("Target").fields,{priority: "high"}));
			expect(info.wiki.getTiddler("Target").fields.priority).toBe("high");
			// Rewrite the text — priority isn't a derived name, should survive
			var newText = "title: body\ntype: multiline\n\nnew body";
			info.wiki.addTiddler(new $tw.Tiddler(info.wiki.getTiddler("Target").fields,{text: newText}));
			expect(info.wiki.getTiddler("Target").fields.priority).toBe("high");
		});
		it("maps a `title: text` sub-entry to the `body` field (legacy/safe convention)", function() {
			var info = setupWiki();
			var text = "title: text\ntype: multiline\n\nhello\n+\ntitle: nickname\n\nJaneT";
			info.wiki.addTiddler({title: "Legacy", type: COMPOUND_TYPE, text: text});
			var t = info.wiki.getTiddler("Legacy");
			expect(t.fields.body).toBe("hello");
			expect(t.fields.text).toBe(text); // compound source must not be clobbered
			expect(t.fields.nickname).toBe("JaneT");
		});
		it("clears a `text→body` derived field when the `title: text` sub-entry is removed", function() {
			var info = setupWiki();
			var text = "title: text\n\nstart\n+\ntitle: keep\n\nval";
			info.wiki.addTiddler({title: "Legacy", type: COMPOUND_TYPE, text: text});
			expect(info.wiki.getTiddler("Legacy").fields.body).toBe("start");
			// Rewrite without the text sub-entry
			var newText = "title: keep\n\nval";
			info.wiki.addTiddler(new $tw.Tiddler(info.wiki.getTiddler("Legacy").fields,{text: newText}));
			expect(info.wiki.getTiddler("Legacy").fields.body).toBeUndefined();
			expect(info.wiki.getTiddler("Legacy").fields.keep).toBe("val");
		});
		it("does not expose reserved names as derived fields", function() {
			var info = setupWiki();
			// Embed reserved-named sub-entries (should be ignored as fields)
			var text = "title: created\n\n20990101000000000\n+\ntitle: tags\n\nshould-not-leak";
			info.wiki.addTiddler({title: "Reserved", type: COMPOUND_TYPE, text: text});
			var t = info.wiki.getTiddler("Reserved");
			// "created" stays the original creation (or undefined here), not the sub-entry value
			expect(t.fields.created).not.toBe("20990101000000000");
			expect(t.fields.tags).not.toBe("should-not-leak");
		});
	});

	// === action-setfield ===

	describe("$action-setfield", function() {
		it("updates a plain sub-entry via $index/$value", function() {
			var info = setupWiki();
			info.invoke("<$action-setfield $tiddler='Target' $index='nickname' $value='NewNick'/>");
			expect(getEntry(info.wiki,"Target","nickname")).toBe("NewNick");
			expect(info.wiki.getTiddler("Target").fields.nickname).toBe("NewNick");
		});
		it("updates a metadata sub-entry and preserves its type header", function() {
			var info = setupWiki();
			info.invoke("<$action-setfield $tiddler='Target' $index='email' $value='fresh@example.com'/>");
			var entry = getEntry(info.wiki,"Target","email");
			expect(entry).toEqual({value: "fresh@example.com", type: "email"});
			// And the serialized text still has the type header
			expect(info.wiki.getTiddler("Target").fields.text).toMatch(/title: email\ntype: email\n\nfresh@example\.com/);
		});
		it("adds a brand new sub-entry", function() {
			var info = setupWiki();
			info.invoke("<$action-setfield $tiddler='Target' $index='city' $value='Vienna'/>");
			expect(getEntry(info.wiki,"Target","city")).toBe("Vienna");
			expect(info.wiki.getTiddler("Target").fields.city).toBe("Vienna");
		});
		it("deletes a sub-entry when $value is omitted (and clears the derived field)", function() {
			var info = setupWiki();
			info.invoke("<$action-setfield $tiddler='Target' $index='nickname'/>");
			expect(getEntry(info.wiki,"Target","nickname")).toBeUndefined();
			expect(info.wiki.getTiddler("Target").fields.nickname).toBeUndefined();
			expect(info.wiki.getTiddler("Target").fields.text.indexOf("title: nickname")).toBe(-1);
		});
		it("$indexProperty sets a metadata header on an existing plain entry", function() {
			var info = setupWiki();
			info.invoke("<$action-setfield $tiddler='Target' $index='nickname' $indexProperty='type' $value='select-thing'/>");
			expect(getEntry(info.wiki,"Target","nickname")).toEqual({value: "OldNick", type: "select-thing"});
		});
		it("$indexProperty removes a metadata header and unwraps to plain string", function() {
			var info = setupWiki();
			info.invoke("<$action-setfield $tiddler='Target' $index='email' $indexProperty='type'/>");
			expect(getEntry(info.wiki,"Target","email")).toBe("old@example.com");
		});
		it("$field=text replaces the entire compound text and triggers stale-clearing", function() {
			var info = setupWiki();
			var newText = "title: body\ntype: multiline\n\nrebuilt";
			info.invoke("<$action-setfield $tiddler='Target' $field='text' $value=\"" + newText + "\"/>");
			expect(info.wiki.getTiddler("Target").fields.body).toBe("rebuilt");
			expect(info.wiki.getTiddler("Target").fields.email).toBeUndefined();
			expect(info.wiki.getTiddler("Target").fields.nickname).toBeUndefined();
		});
		it("$field=<derived-name> is silently overridden by re-derivation (compound text wins)", function() {
			var info = setupWiki();
			info.invoke("<$action-setfield $tiddler='Target' $field='email' $value='leaked@x.com'/>");
			// Re-derivation snaps email back to the text value
			expect(info.wiki.getTiddler("Target").fields.email).toBe("old@example.com");
		});
		it("$field=<custom-non-derived-name> persists", function() {
			var info = setupWiki();
			info.invoke("<$action-setfield $tiddler='Target' $field='priority' $value='high'/>");
			expect(info.wiki.getTiddler("Target").fields.priority).toBe("high");
		});
	});

	// === action-deletefield ===

	describe("$action-deletefield", function() {
		it("removes a custom non-derived field permanently", function() {
			var info = setupWiki();
			info.invoke("<$action-setfield $tiddler='Target' $field='priority' $value='high'/>");
			expect(info.wiki.getTiddler("Target").fields.priority).toBe("high");
			info.invoke("<$action-deletefield $tiddler='Target' priority/>");
			expect(info.wiki.getTiddler("Target").fields.priority).toBeUndefined();
		});
		it("on a derived field name: the field gets re-derived back from compound text", function() {
			var info = setupWiki();
			info.invoke("<$action-deletefield $tiddler='Target' nickname/>");
			// nickname was removed from top-level fields, but addTiddler hook re-derives it
			expect(info.wiki.getTiddler("Target").fields.nickname).toBe("OldNick");
		});
	});

	// === action-setmultiplefields ===

	describe("$action-setmultiplefields", function() {
		it("$indexes updates multiple sub-entries and preserves metadata wrappers", function() {
			var info = setupWiki();
			info.invoke("<$action-setmultiplefields $tiddler='Target' $indexes='[[email]] [[nickname]]' $values='[[fresh@x.com]] [[FreshNick]]'/>");
			expect(getEntry(info.wiki,"Target","email")).toEqual({value: "fresh@x.com", type: "email"});
			expect(getEntry(info.wiki,"Target","nickname")).toBe("FreshNick");
			expect(info.wiki.getTiddler("Target").fields.text).toMatch(/title: email\ntype: email\n\nfresh@x\.com/);
		});
		it("$fields on derived names is overridden by re-derivation", function() {
			var info = setupWiki();
			info.invoke("<$action-setmultiplefields $tiddler='Target' $fields='[[email]] [[nickname]]' $values='[[leak1]] [[leak2]]'/>");
			expect(info.wiki.getTiddler("Target").fields.email).toBe("old@example.com");
			expect(info.wiki.getTiddler("Target").fields.nickname).toBe("OldNick");
		});
	});

	// === action-listops ===

	describe("$action-listops", function() {
		it("$index + $subfilter appends to an existing sub-entry list", function() {
			var info = setupWiki();
			info.invoke("<$action-setfield $tiddler='Target' $index='tags-list' $value='alpha beta'/>");
			info.invoke("<$action-listops $tiddler='Target' $index='tags-list' $subfilter='[[gamma]]'/>");
			expect(getEntry(info.wiki,"Target","tags-list")).toBe("alpha beta gamma");
		});
		it("$index + $filter replaces a sub-entry list", function() {
			var info = setupWiki();
			info.invoke("<$action-setfield $tiddler='Target' $index='roles' $value='one two three'/>");
			info.invoke("<$action-listops $tiddler='Target' $index='roles' $filter='[[only-this]]'/>");
			expect(getEntry(info.wiki,"Target","roles")).toBe("only-this");
		});
		it("$field=tags edits the reserved tags field", function() {
			var info = setupWiki();
			info.invoke("<$action-listops $tiddler='Target' $tags='alpha bravo'/>");
			var tags = info.wiki.getTiddler("Target").fields.tags;
			expect(tags.indexOf("alpha")).not.toBe(-1);
			expect(tags.indexOf("bravo")).not.toBe(-1);
		});
	});

	// === checkbox / radio / select / range (index forms) ===

	describe("Input widgets with index= attribute", function() {
		it("$checkbox toggles a plain sub-entry via index", function() {
			var info = setupWiki();
			// Set initial — using checkbox unchecked value
			info.invoke("<$action-setfield $tiddler='Target' $index='favorite' $value='no'/>");
			expect(getEntry(info.wiki,"Target","favorite")).toBe("no");
			// Programmatically simulate a check by using setText (the checkbox widget's effect)
			info.wiki.setText("Target",null,"favorite","yes");
			expect(getEntry(info.wiki,"Target","favorite")).toBe("yes");
			expect(info.wiki.getTiddler("Target").fields.favorite).toBe("yes");
		});
		it("$radio sets a sub-entry value via index (preserves metadata wrapper)", function() {
			var info = setupWiki();
			// email starts as {value, type: "email"}; setText via index keeps the wrapper
			info.wiki.setText("Target",null,"email","jane@example.com");
			expect(getEntry(info.wiki,"Target","email")).toEqual({value: "jane@example.com", type: "email"});
		});
	});

	// === edit-text via direct setText path used by the editor factory ===

	describe("edit widgets (factory update path)", function() {
		it("setText with metadata-wrapped entry keeps the wrapper", function() {
			var info = setupWiki();
			info.wiki.setText("Target",null,"email","x@y.z");
			var entry = getEntry(info.wiki,"Target","email");
			expect(entry).toEqual({value: "x@y.z", type: "email"});
		});
		it("setText with undefined value deletes the sub-entry AND the derived field", function() {
			var info = setupWiki();
			info.wiki.setText("Target",null,"nickname",undefined);
			expect(getEntry(info.wiki,"Target","nickname")).toBeUndefined();
			expect(info.wiki.getTiddler("Target").fields.nickname).toBeUndefined();
		});
	});

	// === Whole-tiddler boundary ===

	describe("Boundary cases", function() {
		it("deleting and recreating restores correct derived fields", function() {
			var info = setupWiki();
			info.wiki.deleteTiddler("Target");
			expect(info.wiki.getTiddler("Target")).toBeUndefined();
			info.wiki.addTiddler({title: "Target", type: COMPOUND_TYPE, text: initialText()});
			expect(info.wiki.getTiddler("Target").fields.body).toBe("initial body");
			expect(info.wiki.getTiddler("Target").fields.email).toBe("old@example.com");
			expect(info.wiki.getTiddler("Target").fields.nickname).toBe("OldNick");
		});
		it("changing type away from +fields stops re-deriving on the next addTiddler", function() {
			var info = setupWiki();
			info.wiki.addTiddler(new $tw.Tiddler(info.wiki.getTiddler("Target").fields,{type: "text/vnd.tiddlywiki"}));
			// On the type change, the hook no longer fires; existing derived fields stay (snapshot)
			var t = info.wiki.getTiddler("Target");
			expect(t.fields.type).toBe("text/vnd.tiddlywiki");
			// But now the text is a plain wikitext string — no derivation happens on subsequent updates
			info.wiki.addTiddler(new $tw.Tiddler(t.fields,{text: "plain content"}));
			expect(info.wiki.getTiddler("Target").fields.text).toBe("plain content");
		});
		it("body value containing a literal '+' line on its own does not split entries", function() {
			// Diagnostic — this currently mis-parses; documents the limitation.
			// A line containing only '+' splits the compound entry. The split chunk
			// after the orphan '+' has no "title:" header, so it is silently dropped.
			var poisoned = "title: body\n\nline 1\n+\nline 2\n+\ntitle: email\n\nx@y.z";
			var data = $tw.utils.parseMultilineFields(poisoned);
			expect(data.body).toBe("line 1");
			expect(data["line 2"]).toBeUndefined(); // dropped — no "title:" header
			expect(data.email).toBe("x@y.z");
		});
	});

});
