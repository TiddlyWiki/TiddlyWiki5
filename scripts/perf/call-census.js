/*
Deterministic call census for TiddlyWiki hot paths.

	node scripts/perf/call-census.js <edition-path> [renders]

Boots an edition, instruments core functions to count their calls over a parse and
render workload, and reports the counts. A CPU sampling profiler mis-attributes time
(stale frames, inlining, aliasing); an exact count catches the ghost before you
optimise it. If the profiler calls a function hot but the census shows few calls,
the profiler is wrong.
*/
"use strict";

var path = require("path");

function instrument(counts, obj, method, label) {
	if(!obj || typeof obj[method] !== "function") {
		return;
	}
	var original = obj[method];
	counts[label] = 0;
	obj[method] = function() {
		counts[label]++;
		return original.apply(this, arguments);
	};
}

function main() {
	var editionPath = process.argv[2];
	var renders = parseInt(process.argv[3], 10);
	if(!editionPath) {
		console.log("Usage: node scripts/perf/call-census.js <edition-path> [renders]");
		process.exit(1);
	}
	if(isNaN(renders) || renders < 1) {
		renders = 3;
	}
	var $tw = require(path.resolve("./boot/boot.js")).TiddlyWiki();
	$tw.boot.argv = [path.resolve(editionPath)];
	$tw.boot.boot(function() {
		var counts = Object.create(null);
		var Widget = $tw.modules.execute("$:/core/modules/widgets/widget.js").widget;
		var WikiParser = $tw.Wiki.parsers["text/vnd.tiddlywiki"];
		// Parse path
		instrument(counts, $tw.Wiki.prototype, "parseText", "Wiki.parseText");
		instrument(counts, $tw.Wiki.prototype, "makeWidget", "Wiki.makeWidget");
		instrument(counts, WikiParser && WikiParser.prototype, "findNextMatch", "WikiParser.findNextMatch");
		instrument(counts, $tw.WikiRuleBase && $tw.WikiRuleBase.prototype, "findNextMatch", "WikiRule.findNextMatch");
		// Widget-tree build + refresh machinery (base methods every widget shares)
		instrument(counts, Widget.prototype, "makeChildWidget", "Widget.makeChildWidget");
		instrument(counts, Widget.prototype, "makeChildWidgets", "Widget.makeChildWidgets");
		instrument(counts, Widget.prototype, "initialise", "Widget.initialise");
		instrument(counts, Widget.prototype, "computeAttributes", "Widget.computeAttributes");
		instrument(counts, Widget.prototype, "getVariableInfo", "Widget.getVariableInfo");
		instrument(counts, Widget.prototype, "refreshChildren", "Widget.refreshChildren");
		// Store + data
		instrument(counts, $tw.Wiki.prototype, "getTiddler", "Wiki.getTiddler");
		instrument(counts, $tw.Wiki.prototype, "getCacheForTiddler", "Wiki.getCacheForTiddler");
		instrument(counts, $tw.Wiki.prototype, "getTiddlerData", "Wiki.getTiddlerData");
		instrument(counts, $tw.utils, "parseJSONSafe", "utils.parseJSONSafe");

		var titles = [];
		$tw.wiki.each(function(tiddler, title) {
			var type = tiddler.fields.type;
			if(type && type !== "text/vnd.tiddlywiki") {
				return;
			}
			if(typeof tiddler.fields.text !== "string" || tiddler.fields.text === "") {
				return;
			}
			titles.push(title);
		});
		var rendered = 0;
		for(var r = 0; r < renders; r++) {
			for(var i = 0; i < titles.length; i++) {
				var parser = $tw.wiki.parseText("text/vnd.tiddlywiki", $tw.wiki.getTiddlerText(titles[i]));
				try {
					var widget = $tw.wiki.makeWidget(parser, {document: $tw.fakeDocument});
					var wrapper = $tw.fakeDocument.createElement("div");
					widget.render(wrapper, null);
					widget.destroy();
					rendered++;
				} catch(e) {}
			}
		}
		var workload = renders + " x " + titles.length + " tiddlers (" + rendered + " rendered)";
		console.log("Call census over " + workload + ":");
		Object.keys(counts).sort(function(a, b) {
			return counts[b] - counts[a];
		}).forEach(function(label) {
			var perRender = rendered > 0 ? (counts[label] / rendered) : 0;
			console.log("  " + String(counts[label]).padStart(10) + "  " + perRender.toFixed(1).padStart(8) + "/render  " + label);
		});
	});
}

main();
