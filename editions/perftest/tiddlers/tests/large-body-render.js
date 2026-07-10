/*\
title: $:/perf/tests/large-body-render.js
type: application/javascript
tags: [[$:/tags/performance-test]]

Measures render and refresh paths for large structured document bodies.

\*/
"use strict";

exports.name = "large-body-render";
exports.platform = "both";

exports.run = function(context) {
	return runScenario(context);
};

function runScenario(context) {
	var wiki = context.wiki,
		basePrefix = "$:/temp/perftest/large-body/",
		sourceTitle = basePrefix + "source",
		embeddedTitle = basePrefix + "embedded",
		unrelatedTitle = basePrefix + "unrelated",
		sectionCount = 40,
		renderMeasurement,
		unrelatedMeasurement,
		relatedMeasurement,
		rendered,
		unrelatedCounter = 0,
		relatedCounter = 0;

	wiki.addTiddler({title: embeddedTitle, text: makeEmbeddedText(0)});
	wiki.addTiddler({title: sourceTitle, text: makeSourceText(sectionCount,embeddedTitle)});

	renderMeasurement = context.measure("initial-render",function() {
		rendered = context.renderText("{{" + sourceTitle + "}}\n");
		return {
			phase: "render",
			taxonomy: "render",
			scenarioId: "large-body-initial-render",
			scenarioTags: ["first-paint","large-document","body-render"],
			scenarioChangeRelation: "none",
			scenarioDescription: "Open a long structured document with many headings, paragraphs, tables, and inline transclusions.",
			fixtureName: "large-body-render",
			fixtureSectionCount: sectionCount,
			petName: "large body render",
			domNodeCountAfter: context.countDomNodes(rendered.wrapper)
		};
	});

	unrelatedMeasurement = context.measure("refresh-unrelated-change",function() {
		var before = context.countDomNodes(rendered.wrapper);
		wiki.addTiddler({title: unrelatedTitle, text: "unrelated-" + unrelatedCounter++});
		context.refresh(rendered.widgetNode,wiki.changedTiddlers,rendered.wrapper);
		wiki.clearTiddlerEventQueue();
		return {
			phase: "refresh",
			taxonomy: "refresh",
			scenarioId: "large-body-refresh-unrelated-change",
			scenarioTags: ["background-edit","large-document","non-visible-change"],
			scenarioChangeRelation: "unrelated",
			scenarioDescription: "Edit a non-related tiddler while a large document remains visible.",
			fixtureName: "large-body-render",
			fixtureSectionCount: sectionCount,
			petName: "large body render",
			changedTiddlerCount: 1,
			domNodeCountBefore: before,
			domNodeCountAfter: context.countDomNodes(rendered.wrapper)
		};
	});

	relatedMeasurement = context.measure("refresh-relevant-change",function() {
		var before = context.countDomNodes(rendered.wrapper);
		wiki.addTiddler({title: embeddedTitle, text: makeEmbeddedText(relatedCounter++)});
		context.refresh(rendered.widgetNode,wiki.changedTiddlers,rendered.wrapper);
		wiki.clearTiddlerEventQueue();
		return {
			phase: "refresh",
			taxonomy: "refresh",
			scenarioId: "large-body-refresh-relevant-change",
			scenarioTags: ["in-view-edit","large-document","embedded-refresh"],
			scenarioChangeRelation: "relevant",
			scenarioDescription: "Edit a transcluded section inside the visible large document.",
			fixtureName: "large-body-render",
			fixtureSectionCount: sectionCount,
			petName: "large body render",
			changedTiddlerCount: 1,
			domNodeCountBefore: before,
			domNodeCountAfter: context.countDomNodes(rendered.wrapper)
		};
	});

	rendered.widgetNode.destroy();
	wiki.deleteTiddler(sourceTitle);
	wiki.deleteTiddler(embeddedTitle);
	wiki.deleteTiddler(unrelatedTitle);
	wiki.clearTiddlerEventQueue();
	return [renderMeasurement,unrelatedMeasurement,relatedMeasurement];
}

function makeSourceText(sectionCount,embeddedTitle) {
	var lines = [];
	for(var i = 0; i < sectionCount; i++) {
		lines.push("!! Section " + (i + 1) + " Heading");
		lines.push("");
		lines.push("Paragraph " + i + " opening sentence with context. Additional supporting sentence for reading flow and DOM node generation. Third sentence to extend paragraph line count.");
		lines.push("");
		lines.push("|!Column A|!Column B|!Column C|");
		lines.push("|Row " + i + " A|Row " + i + " B|Row " + i + " C|");
		lines.push("|Row " + (i + 1) + " A|Row " + (i + 1) + " B|Row " + (i + 1) + " C|");
		lines.push("");
		if(i === Math.floor(sectionCount / 2)) {
			lines.push("{{" + embeddedTitle + "}}");
			lines.push("");
		}
		lines.push("* Item alpha " + i);
		lines.push("* Item beta " + i);
		lines.push("* Item gamma " + i);
		lines.push("");
	}
	return lines.join("\n");
}

function makeEmbeddedText(revision) {
	return [
		"''Embedded Section'' — revision " + revision,
		"",
		"This embedded tiddler simulates a shared fragment refreshed independently.",
		"",
		"Inline content with ''bold'', //italic//, and `code`.",
		""
	].join("\n");
}
