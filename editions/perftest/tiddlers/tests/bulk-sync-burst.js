/*\
title: $:/perf/tests/bulk-sync-burst.js
type: application/javascript
tags: [[$:/tags/performance-test]]

Measures render and refresh behavior during bursty sync-like updates.

\*/
"use strict";

exports.name = "bulk-sync-burst";
exports.platform = "both";

exports.run = function(context) {
	var modes = ["unset","no","yes"],
		measurements = [];
	for(var i = 0; i < modes.length; i++) {
		measurements.push.apply(measurements,runMode(context,modes[i]));
	}
	return measurements;
};

function runMode(context,mode) {
	var wiki = context.wiki,
		configTitle = "$:/config/ResilientRender",
		originalConfig = wiki.getTiddler(configTitle),
		basePrefix = "$:/temp/perftest/bulk-sync/",
		itemPrefix = basePrefix + "item-",
		backgroundPrefix = basePrefix + "background-",
		renderTitle = basePrefix + "source",
		itemCount = 1000,
		visibleCount = 150,
		burstSize = 120,
		renderMeasurement,
		unrelatedMeasurement,
		relatedMeasurement,
		rendered,
		unrelatedCounter = 0,
		relatedCounter = 0;

	setResilientRenderMode(wiki,mode);
	seedItems(wiki,itemPrefix,backgroundPrefix,itemCount,burstSize);
	wiki.addTiddler({title: renderTitle, text: makeSourceText(itemPrefix,visibleCount)});

	renderMeasurement = context.measure("initial-render",function() {
		rendered = context.renderText("{{" + renderTitle + "}}\n");
		return {
			mode: mode,
			phase: "render",
			taxonomy: "render",
			scenarioId: "bulk-sync-burst-initial-render",
			scenarioTags: ["sync","burst","first-paint"],
			scenarioChangeRelation: "none",
			scenarioDescription: "Open a large list before a sync-like burst of updates.",
			fixtureName: "bulk-sync-burst",
			fixtureItemCount: itemCount,
			burstSize: burstSize,
			petName: "bulk sync burst",
			domNodeCountAfter: context.countDomNodes(rendered.wrapper)
		};
	});

	unrelatedMeasurement = context.measure("refresh-unrelated-change",function() {
		var before = context.countDomNodes(rendered.wrapper);
		for(var i = 0; i < burstSize; i++) {
			wiki.addTiddler({title: backgroundPrefix + pad(i,4), text: "bg-" + mode + "-" + unrelatedCounter + "-" + i});
		}
		unrelatedCounter++;
		context.refresh(rendered.widgetNode,wiki.changedTiddlers,rendered.wrapper);
		wiki.clearTiddlerEventQueue();
		return {
			mode: mode,
			phase: "refresh",
			taxonomy: "refresh",
			scenarioId: "bulk-sync-burst-refresh-unrelated-change",
			scenarioTags: ["sync","burst","non-visible-change"],
			scenarioChangeRelation: "unrelated",
			scenarioDescription: "Apply a burst of background updates that do not touch visible rows.",
			fixtureName: "bulk-sync-burst",
			fixtureItemCount: itemCount,
			burstSize: burstSize,
			petName: "bulk sync burst",
			changedTiddlerCount: burstSize,
			domNodeCountBefore: before,
			domNodeCountAfter: context.countDomNodes(rendered.wrapper)
		};
	});

	relatedMeasurement = context.measure("refresh-relevant-change",function() {
		var before = context.countDomNodes(rendered.wrapper);
		for(var i = 0; i < burstSize; i++) {
			wiki.addTiddler({title: itemPrefix + pad(i,4), text: "visible-" + mode + "-" + relatedCounter + "-" + i, tags: ["project-a","status-open"]});
		}
		relatedCounter++;
		context.refresh(rendered.widgetNode,wiki.changedTiddlers,rendered.wrapper);
		wiki.clearTiddlerEventQueue();
		return {
			mode: mode,
			phase: "refresh",
			taxonomy: "refresh",
			scenarioId: "bulk-sync-burst-refresh-relevant-change",
			scenarioTags: ["sync","burst","visible-content-change"],
			scenarioChangeRelation: "relevant",
			scenarioDescription: "Apply a burst of updates that directly touch visible rows.",
			fixtureName: "bulk-sync-burst",
			fixtureItemCount: itemCount,
			burstSize: burstSize,
			petName: "bulk sync burst",
			changedTiddlerCount: burstSize,
			domNodeCountBefore: before,
			domNodeCountAfter: context.countDomNodes(rendered.wrapper)
		};
	});

	rendered.widgetNode.destroy();
	cleanupItems(wiki,itemPrefix,backgroundPrefix,itemCount,burstSize,renderTitle);
	restoreResilientRenderMode(wiki,configTitle,originalConfig);
	wiki.clearTiddlerEventQueue();
	return [renderMeasurement,unrelatedMeasurement,relatedMeasurement];
}

function seedItems(wiki,itemPrefix,backgroundPrefix,itemCount,burstSize) {
	for(var i = 0; i < itemCount; i++) {
		wiki.addTiddler({
			title: itemPrefix + pad(i,4),
			text: "Item " + i + " baseline content for sync burst workloads.",
			tags: ["project-a","status-open"]
		});
	}
	for(var j = 0; j < burstSize; j++) {
		wiki.addTiddler({title: backgroundPrefix + pad(j,4), text: "background baseline " + j});
	}
}

function cleanupItems(wiki,itemPrefix,backgroundPrefix,itemCount,burstSize,renderTitle) {
	wiki.deleteTiddler(renderTitle);
	for(var i = 0; i < itemCount; i++) {
		wiki.deleteTiddler(itemPrefix + pad(i,4));
	}
	for(var j = 0; j < burstSize; j++) {
		wiki.deleteTiddler(backgroundPrefix + pad(j,4));
	}
}

function makeSourceText(itemPrefix,visibleCount) {
	return [
		"<$list filter=\"[prefix[" + itemPrefix + "]] +[sort[]] +[limit[" + visibleCount + "]]\">",
		"<div class=\"perf-sync-row\"><$view field=\"title\"/> : <$view field=\"text\"/></div>",
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

function setResilientRenderMode(wiki,mode) {
	if(mode === "unset") {
		wiki.deleteTiddler("$:/config/ResilientRender");
	} else {
		wiki.addTiddler({title: "$:/config/ResilientRender", text: mode});
	}
}

function restoreResilientRenderMode(wiki,configTitle,originalConfig) {
	if(originalConfig) {
		wiki.addTiddler(originalConfig);
	} else {
		wiki.deleteTiddler(configTitle);
	}
}
