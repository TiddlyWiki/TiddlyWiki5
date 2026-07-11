/*\
title: $:/perf/tests/parse-render-phases.js
type: application/javascript
tags: [[$:/tags/performance-test]]

Captures powered, phase-separated timing for how wikitext parses into a parse tree and then renders into a widget tree plus DOM, with tree-size metrics for each representative input.

\*/

"use strict";

exports.name = "parse-render-phases";
exports.platform = "both";
exports.warmup = 5;
exports.iterations = 100;

exports.run = function(context) {
	var inputs = makeInputs(),
		measurements = [];
	for(var i = 0; i < inputs.length; i++) {
		measurements.push.apply(measurements,measurePhases(context,inputs[i]));
	}
	return measurements;
};

function measurePhases(context,input) {
	var wiki = context.wiki,
		document = context.document,
		text = input.text,
		// Capture tree sizes once, outside the timed loops
		referenceParser = wiki.parseText("text/vnd.tiddlywiki",text),
		parseTreeNodes = countParseTree(referenceParser.tree),
		reference = context.renderText(text),
		widgetTreeNodes = countWidgetTree(reference.widgetNode),
		domNodes = context.countDomNodes(reference.wrapper);
	reference.widgetNode.destroy();
	var parseMeasurement = context.measure(input.id + "-parse",function() {
		wiki.parseText("text/vnd.tiddlywiki",text);
		return phaseMetadata(input,"parse","text-to-parse-tree",{
			parseTreeNodes: parseTreeNodes
		});
	});
	var renderMeasurement = context.measure(input.id + "-render",function() {
		var parser = wiki.parseText("text/vnd.tiddlywiki",text),
			widgetNode = wiki.makeWidget(parser,{document: document}),
			wrapper = document.createElement("div");
		widgetNode.render(wrapper,null);
		widgetNode.destroy();
		return phaseMetadata(input,"render","parse-tree-to-widget-tree-and-dom",{
			parseTreeNodes: parseTreeNodes,
			widgetTreeNodes: widgetTreeNodes,
			domNodes: domNodes
		});
	});
	return [parseMeasurement,renderMeasurement];
}

function phaseMetadata(input,phase,taxonomy,extra) {
	var metadata = {
		mode: "main",
		phase: phase,
		taxonomy: taxonomy,
		scenarioId: input.id + "-" + phase,
		scenarioDescription: input.description,
		fixtureName: "parse-render-phases",
		petName: input.id + " " + phase,
		inputBytes: input.text.length
	};
	return $tw.utils.extend(metadata,extra);
}

function countParseTree(nodes) {
	var count = 0;
	$tw.utils.each(nodes,function(node) {
		count += 1;
		if(node.children) {
			count += countParseTree(node.children);
		}
	});
	return count;
}

function countWidgetTree(widgetNode) {
	var count = 1;
	$tw.utils.each(widgetNode.children,function(child) {
		count += countWidgetTree(child);
	});
	return count;
}

function makeInputs() {
	return [
		{
			id: "structured",
			description: "Rule-heavy prose: headings, formatted paragraphs, lists and links.",
			text: makeStructured(30)
		},
		{
			id: "widgety",
			description: "Widget-heavy source: a list widget expanding many element and text widgets.",
			text: "<$list filter=\"[range[40]]\" variable=\"index\">\n<span class=\"tc-perf-item\"><$text text=<<index>>/></span>\n</$list>"
		}
	];
}

function makeStructured(count) {
	var lines = [];
	for(var i = 0; i < count; i++) {
		lines.push("!! Heading " + i);
		lines.push("A paragraph carrying ''bold'', //italic// and a [[link|Target " + i + "]].");
		lines.push("* first item " + i);
		lines.push("* second item " + i);
		lines.push("");
	}
	return lines.join("\n");
}
