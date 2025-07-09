/*\
title: $:/plugins/tiddlywiki/jasmine/run-wiki-based-tests.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the wiki based tests

\*/

"use strict";

const TEST_WIKI_TIDDLER_FILTER = "[all[tiddlers+shadows]type[text/vnd.tiddlywiki-multiple]tag[$:/tags/wiki-test-spec]]";

const widget = require("$:/core/modules/widgets/widget.js");

describe("Wiki-based tests",() => {

	// Step through the test tiddlers
	const tests = $tw.wiki.filterTiddlers(TEST_WIKI_TIDDLER_FILTER);
	$tw.utils.each(tests,(title) => {
		const tiddler = $tw.wiki.getTiddler(title);
		it(`${tiddler.fields.title}: ${tiddler.fields.description}`,() => {
			// Add our tiddlers
			const wiki = new $tw.Wiki();
			const coreTiddler = $tw.wiki.getTiddler("$:/core");
			if(coreTiddler) {
				wiki.addTiddler(coreTiddler);
			}
			wiki.addTiddlers(readMultipleTiddlersTiddler(title));
			// Unpack plugin tiddlers
			wiki.readPluginInfo();
			wiki.registerPluginTiddlers("plugin");
			wiki.unpackPluginTiddlers();
			wiki.addIndexersToWiki();
			// Clear changes queue
			wiki.clearTiddlerEventQueue();
			// Complain if we don't have the ouput and expected results
			if(!wiki.tiddlerExists("Output")) {
				throw "Missing 'Output' tiddler";
			}
			if(wiki.tiddlerExists("ExpectedResult")) {
				// Construct the widget node
				const text = "{{Output}}\n\n";
				const widgetNode = createWidgetNode(parseText(text,wiki),wiki);
				// Render the widget node to the DOM
				const wrapper = renderWidgetNode(widgetNode);
				// Clear changes queue
				wiki.clearTiddlerEventQueue();
				// Run the actions if provided
				if(wiki.tiddlerExists("Actions")) {
					widgetNode.invokeActionString(wiki.getTiddlerText("Actions"));
					refreshWidgetNode(widgetNode,wrapper);
				}
				// Test the rendering
				expect(wrapper.innerHTML).toBe(wiki.getTiddlerText("ExpectedResult"));
			}
		});
	});

	function readMultipleTiddlersTiddler(title) {
		const rawTiddlers = $tw.wiki.getTiddlerText(title).split(/\r?\n\+\r?\n/mg);
		const tiddlers = [];
		$tw.utils.each(rawTiddlers,(rawTiddler) => {
			let fields = Object.create(null);
			const split = rawTiddler.split(/\r?\n\r?\n/mg);
			if(split.length >= 1) {
				fields = $tw.utils.parseFields(split[0],fields);
			}
			if(split.length >= 2) {
				fields.text = split.slice(1).join("\n\n");
			}
			tiddlers.push(fields);
		});
		return tiddlers;
	}

	function createWidgetNode(parser,wiki) {
		return wiki.makeWidget(parser);
	}

	function parseText(text,wiki,options) {
		return wiki.parseText("text/vnd.tiddlywiki",text,options);
	}

	function renderWidgetNode(widgetNode) {
		$tw.fakeDocument.setSequenceNumber(0);
		const wrapper = $tw.fakeDocument.createElement("div");
		widgetNode.render(wrapper,null);
		// console.log(require("util").inspect(wrapper,{depth: 8}));
		return wrapper;
	}

	function refreshWidgetNode(widgetNode,wrapper) {
		widgetNode.refresh(widgetNode.wiki.changedTiddlers,wrapper);
		// console.log(require("util").inspect(wrapper,{depth: 8}));
	}

});
