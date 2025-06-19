/*\
title: test-widget-getVariableInfo.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the wikitext rendering pipeline end-to-end. We also need tests that individually test parsers, rendertreenodes etc., but this gets us started.

\*/
"use strict";

describe("Widget module", function() {

	var widget = require("$:/core/modules/widgets/widget.js");

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
// console.log(require("util").inspect(wrapper,{depth: 8}));
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
// console.log(require("util").inspect(wrapper,{depth: 8}));
	}

	it("should make sure that getVariableInfo returns all expected parameters", function() {
		var wiki = new  $tw.Wiki();
		wiki.addTiddlers([
			{title: "A", text: "\\define macro(a:aa) aaa"},
			{title: "B", text: "\\function fn(f:ff) fff\n\\function x() [<fn>]"},
			{title: "C", text: "\\procedure proc(p:pp) ppp"},
			{title: "D", text: "\\widget $my.widget(w:ww) www"}
		]);
		var text = "\\import A B C D\n\n<$let abc=def>";
		var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
		// Render the widget node to the DOM
		renderWidgetNode(widgetNode);
		var childNode = widgetNode;
		while(childNode.children.length > 0) {
			childNode = childNode.children[0];
		}

		expect(childNode.getVariableInfo("macro",{allowSelfAssigned:true}).params).toEqual([{name:"a",value:"aa"}]);

		// function params
		expect(childNode.getVariableInfo("fn",   {allowSelfAssigned:true}).params).toEqual([{name:"f",value:"ff"}]);
		// functions have a text and a value
		expect(childNode.getVariableInfo("x",   {allowSelfAssigned:true}).text).toBe("fff");
		expect(childNode.getVariableInfo("x",   {allowSelfAssigned:true}).srcVariable.value).toBe("[<fn>]");

		// procedures and widgets failed prior to v5.3.4
		expect(childNode.getVariableInfo("proc", {allowSelfAssigned:true}).params).toEqual([{name:"p",default:"pp"}]);
		expect(childNode.getVariableInfo("$my.widget", {allowSelfAssigned:true}).params).toEqual([{name:"w",default:"ww"}]);

		// no params expected
		expect(childNode.getVariableInfo("abc", {allowSelfAssigned:true})).toEqual({text:"def"});

		// debugger; Find code in browser

		// Find values to be compated to
		// console.log("macro", childNode.getVariableInfo("macro",{allowSelfAssigned:true}));
		// console.log("function", childNode.getVariableInfo("fn",{allowSelfAssigned:true}));
		// console.log("function x", childNode.getVariableInfo("x",{allowSelfAssigned:true}));
		// console.log("procedure", childNode.getVariableInfo("proc",{allowSelfAssigned:true}));
		// console.log("widget", childNode.getVariableInfo("$my.widget",{allowSelfAssigned:true}));
		// console.log("let", childNode.getVariableInfo("abc",{allowSelfAssigned:true}));
	});

});

