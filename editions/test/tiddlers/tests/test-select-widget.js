/*\
title: test-select-widget.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the select widget, focused on multi-select refresh behaviour.

\*/

"use strict";

describe("Select widget", function() {

	var widget = require("$:/core/modules/widgets/widget.js");

	// Helpers reused from: test-widget.js and  test-checkbox-widget.js
	function createWidgetNode(parseTreeNode,wiki) {
		return new widget.widget(parseTreeNode,{
			wiki: wiki,
			document: $tw.fakeDocument
		});
	}

	function parseText(text,wiki,options) {
		var parser = wiki.parseText("text/vnd.tiddlywiki",text,options);
		return parser ? {type: "widget", children: parser.tree} : undefined;
	}

	function renderWidgetNode(widgetNode) {
		$tw.fakeDocument.setSequenceNumber(0);
		var wrapper = $tw.fakeDocument.createElement("div");
		widgetNode.render(wrapper,null);
		return wrapper;
	}

	function refreshWidgetNode(widgetNode,wrapper,changes) {
		var changedTiddlers = {};
		if(changes) {
			$tw.utils.each(changes,function(title) {
				changedTiddlers[title] = true;
			});
		}
		widgetNode.refresh(changedTiddlers,wrapper,null);
	}

	// Don't pass fakedom elements to Jasmine matchers. The matchers pretty-print
	// values on assertion which walks the element.style Proxy with Symbol keys and
	// crashes inside convertStyleNameToPropertyName.
	// TODO: once issue: "fakedom style Proxy guards against non-string property keys" lands
	//       revert these workarounds to idiomatic matchers (toBe(null), toBeUndefined()).
	function findSelectDom(node) {
		if(node.tag === "select") return node;
		if(node.children) {
			for(var i = 0; i < node.children.length; i++) {
				var found = findSelectDom(node.children[i]);
				if(found) return found;
			}
		}
		return null;
	}

	function selectedFlags(parent) {
		var result = [];
		for(var i = 0; i < parent.children.length; i++) {
			result.push(!!parent.children[i].selected);
		}
		return result;
	}

	// Regression test for https://github.com/TiddlyWiki/TiddlyWiki5/issues/9839
	// PR #8093 added <optgroup> support but used `child.children.length === 0` to
	// distinguish a plain <option> from an <optgroup>. That heuristic misfires for
	// any <option> whose contents render to inline HTML elements (e.g. tc-tiddlylink
	// auto-links generated for "$:/..." titles), so the option's `selected` state
	// was never restored on refresh.
	it("preserves multi-select state across refresh when options contain inline HTML children",function() {
		var wiki = $tw.test.wiki();
		wiki.addTiddlers([
			{title: "Picks", mylist: "foo $:/mumble"}
		]);
		// Each option has element children to mimic the auto-link case from #9839.
		// Explicit value attribute lets fakedom resolve option.value (real browsers
		// fall back to text content).
		var widgetText = "<$select tiddler='Picks' field='mylist' multiple>" +
			"<option value='foo'><span>foo</span></option>" +
			"<option value='bar'><span>bar</span></option>" +
			"<option value='$:/mumble'><a class='tc-tiddlylink'>$:/mumble</a></option>" +
			"</$select>";
		var widgetNode = createWidgetNode(parseText(widgetText,wiki),wiki);
		var wrapper = renderWidgetNode(widgetNode);
		var select = findSelectDom(wrapper);
		expect(select === null).toBe(false);
		expect(select.children.length).toBe(3);

		// After initial render, options matching the field value should be selected.
		// foo (idx 0), bar (idx 1), $:/mumble (idx 2).
		expect(selectedFlags(select)).toEqual([true,false,true]);

		// Change the stored field value and refresh - this is where the bug surfaced:
		// the "$:/mumble" option (with an <a> child) was wrongly skipped.
		wiki.addTiddler({title: "Picks", mylist: "bar $:/mumble"});
		refreshWidgetNode(widgetNode,wrapper,["Picks"]);

		expect(selectedFlags(select)).toEqual([false,true,true]);
		// The inner <a> must not be touched - .selected is meaningful only on <option>.
		var innerLinkSelected = select.children[2].children[0].selected;
		expect(innerLinkSelected === undefined).toBe(true);
	});

	it("still selects options inside <optgroup> across refresh, including $:/-prefixed entries with inline HTML",function() {
		var wiki = $tw.test.wiki();
		wiki.addTiddlers([
			{title: "Picks", mylist: "1 $:/mumble"}
		]);
		// The "high" group mixes a plain option with a $:/-prefixed option whose
		// content is wrapped in an auto-link <a> - same pattern that broke #9839
		// for top-level options, exercised here inside an <optgroup>.
		var widgetText = "<$select tiddler='Picks' field='mylist' multiple>" +
			"<optgroup label='low'>" +
				"<option value='1'>1</option>" +
				"<option value='2'>2</option>" +
			"</optgroup>" +
			"<optgroup label='high'>" +
				"<option value='4'>4</option>" +
				"<option value='$:/mumble'><a class='tc-tiddlylink'>$:/mumble</a></option>" +
			"</optgroup>" +
			"</$select>";
		var widgetNode = createWidgetNode(parseText(widgetText,wiki),wiki);
		var wrapper = renderWidgetNode(widgetNode);
		var select = findSelectDom(wrapper);
		expect(select === null).toBe(false);
		expect(select.children.length).toBe(2);

		// Initial state: "1" and "$:/mumble" selected
		expect(selectedFlags(select.children[0])).toEqual([true,false]);
		expect(selectedFlags(select.children[1])).toEqual([false,true]);

		wiki.addTiddler({title: "Picks", mylist: "2 4"});
		refreshWidgetNode(widgetNode,wrapper,["Picks"]);
		expect(selectedFlags(select.children[0])).toEqual([false,true]);
		expect(selectedFlags(select.children[1])).toEqual([true,false]);
	});

});
