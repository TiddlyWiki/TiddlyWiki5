/*\
title: $:/perf/tests/filter-heavy-lists.js
type: application/javascript
tags: [[$:/tags/performance-test]]

Measures render and refresh paths for filter-heavy large-wiki style lists.

\*/
"use strict";

exports.name = "filter-heavy-lists";
exports.platform = "both";

exports.run = function(context) {
	return runScenario(context);
};

function runScenario(context) {
	var wiki = context.wiki,
		basePrefix = "$:/temp/perftest/filter-heavy/",
		itemPrefix = basePrefix + "task-",
		renderTitle = basePrefix + "source",
		unrelatedTitle = basePrefix + "unrelated",
		itemCount = 2000,
		relevantTitle = itemPrefix + "0006",
		renderMeasurement,
		unrelatedMeasurement,
		relatedMeasurement,
		rendered,
		unrelatedCounter = 0,
		relatedCounter = 0;

	seedItems(wiki,itemPrefix,itemCount);
	wiki.addTiddler({title: renderTitle, text: makeSourceText(itemPrefix)});

	renderMeasurement = context.measure("initial-render",function() {
		rendered = context.renderText("{{" + renderTitle + "}}\n");
		return {
			phase: "render",
			taxonomy: "render",
			scenarioId: "filter-heavy-initial-render",
			scenarioTags: ["first-paint","large-wiki","filter-heavy"],
			scenarioChangeRelation: "none",
			scenarioDescription: "Open a large filtered list with heavy filter clauses and sorted results.",
			fixtureName: "filter-heavy-lists",
			fixtureItemCount: itemCount,
			petName: "filter heavy lists",
			domNodeCountAfter: context.countDomNodes(rendered.wrapper)
		};
	});

	unrelatedMeasurement = context.measure("refresh-unrelated-change",function() {
		var before = context.countDomNodes(rendered.wrapper);
		wiki.addTiddler({title: unrelatedTitle, text: "background-" + unrelatedCounter++});
		context.refresh(rendered.widgetNode,wiki.changedTiddlers,rendered.wrapper);
		wiki.clearTiddlerEventQueue();
		return {
			phase: "refresh",
			taxonomy: "refresh",
			scenarioId: "filter-heavy-refresh-unrelated-change",
			scenarioTags: ["background-edit","large-wiki","non-visible-change"],
			scenarioChangeRelation: "unrelated",
			scenarioDescription: "Edit an unrelated tiddler while a heavy filtered list remains visible.",
			fixtureName: "filter-heavy-lists",
			fixtureItemCount: itemCount,
			petName: "filter heavy lists",
			changedTiddlerCount: 1,
			domNodeCountBefore: before,
			domNodeCountAfter: context.countDomNodes(rendered.wrapper)
		};
	});

	relatedMeasurement = context.measure("refresh-relevant-change",function() {
		var before = context.countDomNodes(rendered.wrapper);
		wiki.addTiddler({
			title: relevantTitle,
			text: "Task content update " + relatedCounter++,
			tags: ["project-a","status-open"]
		});
		context.refresh(rendered.widgetNode,wiki.changedTiddlers,rendered.wrapper);
		wiki.clearTiddlerEventQueue();
		return {
			phase: "refresh",
			taxonomy: "refresh",
			scenarioId: "filter-heavy-refresh-relevant-change",
			scenarioTags: ["in-view-edit","large-wiki","filter-recompute"],
			scenarioChangeRelation: "relevant",
			scenarioDescription: "Edit a tiddler that participates in the current heavy filter results.",
			fixtureName: "filter-heavy-lists",
			fixtureItemCount: itemCount,
			petName: "filter heavy lists",
			changedTiddlerCount: 1,
			domNodeCountBefore: before,
			domNodeCountAfter: context.countDomNodes(rendered.wrapper)
		};
	});

	rendered.widgetNode.destroy();
	cleanupItems(wiki,basePrefix,itemPrefix,itemCount,renderTitle);
	wiki.clearTiddlerEventQueue();
	return [renderMeasurement,unrelatedMeasurement,relatedMeasurement];
}

function seedItems(wiki,itemPrefix,itemCount) {
	for(var i = 0; i < itemCount; i++) {
		var title = itemPrefix + pad(i,4),
			tags = [i % 2 === 0 ? "project-a" : "project-b", i % 3 === 0 ? "status-open" : "status-closed"],
			text = "Task " + i + " summary with details for list rendering and filtering.";
		if(i % 11 === 0) {
			tags.push("archived");
		}
		wiki.addTiddler({
			title: title,
			text: text,
			tags: tags,
			status: i % 3 === 0 ? "open" : "closed",
			priority: String(i % 5)
		});
	}
}

function cleanupItems(wiki,basePrefix,itemPrefix,itemCount,renderTitle) {
	wiki.deleteTiddler(renderTitle);
	wiki.deleteTiddler(basePrefix + "unrelated");
	for(var i = 0; i < itemCount; i++) {
		wiki.deleteTiddler(itemPrefix + pad(i,4));
	}
}

function makeSourceText(itemPrefix) {
	var filter = "[prefix[" + itemPrefix + "]] +[tag[project-a]] +[tag[status-open]] +[!tag[archived]] +[search:title[task]] +[sort[modified]reverse[]] +[limit[120]]";
	return [
		"<$list filter=\"" + filter + "\">",
		"<div class=\"perf-filter-heavy-row\"><$view field=\"title\"/> | <$view field=\"status\"/> | <$view field=\"text\"/></div>",
		"</$list>"
	].join("\n");
}

function pad(value,width) {
	var text = String(value);
	while(text.length < width) {
		text = "0" + text;
	}
	return text;
}
