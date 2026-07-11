/*\
title: $:/perf/tests/real-content-corpus.js
type: application/javascript
tags: [[$:/tags/performance-test]]

Parses and renders the real included wiki corpus, measuring aggregate cost and counting recovery diagnostics so the resilience work reads against real content.

\*/

"use strict";

exports.name = "real-content-corpus";
exports.platform = "node";
exports.warmup = 1;
exports.iterations = 3;

exports.run = function(context) {
	var wiki = context.wiki,
		titles = collectWikitextTitles(wiki),
		measurements = [];
	measurements.push(measureParse(context,titles));
	measurements.push(measureRender(context,titles));
	return measurements;
};

function collectWikitextTitles(wiki) {
	var titles = [];
	wiki.each(function(tiddler,title) {
		var type = tiddler.fields.type;
		if(type && type !== "text/vnd.tiddlywiki") {
			return;
		}
		if(typeof tiddler.fields.text !== "string" || tiddler.fields.text === "") {
			return;
		}
		titles.push(title);
	});
	return titles;
}

function measureParse(context,titles) {
	return context.measure("corpus-parse",function() {
		var topLevelNodes = 0,
			diagnosticCount = 0,
			tiddlersWithDiagnostics = 0;
		for(var i = 0; i < titles.length; i++) {
			var parser = context.wiki.parseText("text/vnd.tiddlywiki",context.wiki.getTiddlerText(titles[i]));
			topLevelNodes += parser.tree.length;
			if(parser.diagnostics && parser.diagnostics.length > 0) {
				diagnosticCount += parser.diagnostics.length;
				tiddlersWithDiagnostics++;
			}
		}
		return {
			mode: "main",
			phase: "parse",
			taxonomy: "real-content",
			scenarioId: "real-content-parse",
			scenarioDescription: "Parse every wikitext tiddler in the real corpus and count recovery diagnostics.",
			fixtureName: "real-content-corpus",
			corpusSize: titles.length,
			topLevelNodes: topLevelNodes,
			diagnosticCount: diagnosticCount,
			tiddlersWithDiagnostics: tiddlersWithDiagnostics
		};
	});
}

function measureRender(context,titles) {
	return context.measure("corpus-render",function() {
		var domNodeCount = 0,
			renderFailures = 0;
		for(var i = 0; i < titles.length; i++) {
			try {
				var rendered = context.renderText(context.wiki.getTiddlerText(titles[i]));
				domNodeCount += context.countDomNodes(rendered.wrapper);
				rendered.widgetNode.destroy();
			} catch(error) {
				renderFailures++;
			}
		}
		return {
			mode: "main",
			phase: "render",
			taxonomy: "real-content",
			scenarioId: "real-content-render",
			scenarioDescription: "Render every wikitext tiddler in the real corpus, counting any that throw.",
			fixtureName: "real-content-corpus",
			corpusSize: titles.length,
			domNodeCount: domNodeCount,
			renderFailures: renderFailures
		};
	});
}
