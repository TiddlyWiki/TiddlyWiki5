/*\
title: $:/plugins/tiddlywiki/jasmine/run-wiki-based-tests.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the wiki based tests

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var TEST_WIKI_TIDDLER_FILTER = "[all[tiddlers+shadows]type[text/vnd.tiddlywiki-multiple]tag[$:/tags/wiki-test-spec]]";

var widget = require("$:/core/modules/widgets/widget.js");

describe("Wiki-based tests", function() {

	// Step through the test tiddlers
	var tests = $tw.wiki.filterTiddlers(TEST_WIKI_TIDDLER_FILTER);
	$tw.utils.each(tests,function(title) {
		var tiddler = $tw.wiki.getTiddler(title);
		it(tiddler.fields.title + ": " + tiddler.fields.description, function() {
			// Add our tiddlers
			var wiki = new $tw.Wiki();
			// Suppress next tick dispatch for wiki change events
			wiki.setDispatchMode(true);
			// Add the core plugin
			var coreTiddler = $tw.wiki.getTiddler("$:/core")
			if(coreTiddler) {
				wiki.addTiddler(coreTiddler);
			}
			// Add other tiddlers
			wiki.addTiddlers(readMultipleTiddlersTiddler(title));
			// Unpack plugin tiddlers
			wiki.readPluginInfo();
			wiki.registerPluginTiddlers("plugin");
			wiki.unpackPluginTiddlers();
			wiki.addIndexersToWiki();
			// Install the language switcher
			var languageSwitcher = new $tw.PluginSwitcher({
				wiki: wiki,
				pluginType: "language",
				controllerTitle: "$:/language",
				defaultPlugins: [
					"$:/languages/en-GB"
				]
			});
			// Install the plugin change event handler
			$tw.utils.installPluginChangeHandler(wiki);
			// Clear changes queue
			wiki.clearTiddlerEventQueue();
			// Complain if we don't have the ouput and expected results
			if(!wiki.tiddlerExists("Output")) {
				throw "Missing 'Output' tiddler";
			}
			if(wiki.tiddlerExists("ExpectedResult")) {
				// Construct the widget node
				var text = "{{Output}}\n\n";
				var widgetNode = createWidgetNode(parseText(text,wiki),wiki);
				// Render the widget node to the DOM
				var wrapper = renderWidgetNode(widgetNode);
				// Install the wiki change event handler
				wiki.addEventListener("change",function(changes) {
					widgetNode.refresh(changes,wrapper);
				});
				// Run the actions if provided
				if(wiki.tiddlerExists("Actions")) {
					widgetNode.invokeActionString(wiki.getTiddlerText("Actions"));
				}
				// Make sure all wiki events have been cleared
				while(wiki.eventsTriggered) {
					wiki.processOutstandingTiddlerEvents();
				}
				// Test the rendering
				expect(wrapper.innerHTML).toBe(wiki.getTiddlerText("ExpectedResult"));
			}
		});
	});

	function readMultipleTiddlersTiddler(title) {
		var rawTiddlers = $tw.wiki.getTiddlerText(title).split(/\r?\n\+\r?\n/mg);
		var tiddlers = [];
		$tw.utils.each(rawTiddlers,function(rawTiddler) {
			var fields = Object.create(null),
				split = rawTiddler.split(/\r?\n\r?\n/mg);
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
		var wrapper = $tw.fakeDocument.createElement("div");
		widgetNode.render(wrapper,null);
// console.log(require("util").inspect(wrapper,{depth: 8}));
		return wrapper;
	}

});

})();
