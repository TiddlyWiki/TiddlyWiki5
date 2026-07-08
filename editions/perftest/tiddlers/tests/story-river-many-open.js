/*\
title: $:/perf/tests/story-river-many-open.js
type: application/javascript
tags: [[$:/tags/performance-test]]

Measures render and refresh paths for a story-river style many-open workload.

\*/
"use strict";

exports.name = "story-river-many-open";
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
		basePrefix = "$:/temp/perftest/story-river/",
		storyPrefix = basePrefix + "story-",
		renderTitle = basePrefix + "source",
		unrelatedTitle = basePrefix + "unrelated",
		storyCount = 60,
		relevantTitle = storyPrefix + "0000",
		renderMeasurement,
		unrelatedMeasurement,
		relatedMeasurement,
		rendered,
		unrelatedCounter = 0,
		relatedCounter = 0;

	setResilientRenderMode(wiki,mode);
	seedStoryItems(wiki,storyPrefix,storyCount);
	wiki.addTiddler({title: renderTitle, text: makeSourceText(storyPrefix,storyCount)});

	renderMeasurement = context.measure("initial-render",function() {
		rendered = context.renderText("{{" + renderTitle + "}}\n");
		return {
			mode: mode,
			phase: "render",
			taxonomy: "render",
			scenarioId: "story-river-initial-render",
			scenarioTags: ["story-river","many-open","first-paint"],
			scenarioChangeRelation: "none",
			scenarioDescription: "Open a story-river style view with many visible tiddlers.",
			fixtureName: "story-river-many-open",
			fixtureItemCount: storyCount,
			petName: "story river many open",
			domNodeCountAfter: context.countDomNodes(rendered.wrapper)
		};
	});

	unrelatedMeasurement = context.measure("refresh-unrelated-change",function() {
		var before = context.countDomNodes(rendered.wrapper);
		wiki.addTiddler({title: unrelatedTitle, text: "story-background-" + mode + "-" + unrelatedCounter++});
		context.refresh(rendered.widgetNode,wiki.changedTiddlers,rendered.wrapper);
		wiki.clearTiddlerEventQueue();
		return {
			mode: mode,
			phase: "refresh",
			taxonomy: "refresh",
			scenarioId: "story-river-refresh-unrelated-change",
			scenarioTags: ["story-river","background-edit","non-visible-change"],
			scenarioChangeRelation: "unrelated",
			scenarioDescription: "Edit a non-visible tiddler while many story items remain open.",
			fixtureName: "story-river-many-open",
			fixtureItemCount: storyCount,
			petName: "story river many open",
			changedTiddlerCount: 1,
			domNodeCountBefore: before,
			domNodeCountAfter: context.countDomNodes(rendered.wrapper)
		};
	});

	relatedMeasurement = context.measure("refresh-relevant-change",function() {
		var before = context.countDomNodes(rendered.wrapper);
		wiki.addTiddler({title: relevantTitle, text: makeStoryText(0,relatedCounter++)});
		context.refresh(rendered.widgetNode,wiki.changedTiddlers,rendered.wrapper);
		wiki.clearTiddlerEventQueue();
		return {
			mode: mode,
			phase: "refresh",
			taxonomy: "refresh",
			scenarioId: "story-river-refresh-relevant-change",
			scenarioTags: ["story-river","in-view-edit","visible-content-change"],
			scenarioChangeRelation: "relevant",
			scenarioDescription: "Edit a visible story-river item while many tiddlers remain open.",
			fixtureName: "story-river-many-open",
			fixtureItemCount: storyCount,
			petName: "story river many open",
			changedTiddlerCount: 1,
			domNodeCountBefore: before,
			domNodeCountAfter: context.countDomNodes(rendered.wrapper)
		};
	});

	rendered.widgetNode.destroy();
	cleanupStoryItems(wiki,basePrefix,storyPrefix,storyCount,renderTitle);
	restoreResilientRenderMode(wiki,configTitle,originalConfig);
	wiki.clearTiddlerEventQueue();
	return [renderMeasurement,unrelatedMeasurement,relatedMeasurement];
}

function seedStoryItems(wiki,storyPrefix,storyCount) {
	for(var i = 0; i < storyCount; i++) {
		wiki.addTiddler({title: storyPrefix + pad(i,4), text: makeStoryText(i,0)});
	}
}

function cleanupStoryItems(wiki,basePrefix,storyPrefix,storyCount,renderTitle) {
	wiki.deleteTiddler(renderTitle);
	wiki.deleteTiddler(basePrefix + "unrelated");
	for(var i = 0; i < storyCount; i++) {
		wiki.deleteTiddler(storyPrefix + pad(i,4));
	}
}

function makeSourceText(storyPrefix,storyCount) {
	return [
		"<$list filter=\"[prefix[" + storyPrefix + "]] +[sort[]] +[limit[" + storyCount + "]]\">",
		"<article class=\"perf-story-river-item\"><h3><$view field=\"title\"/></h3><div><$view field=\"text\"/></div></article>",
		"</$list>"
	].join("\n");
}

function makeStoryText(index,revision) {
	return [
		"Story item " + index + " revision " + revision,
		"Line one for visible item context.",
		"Line two with additional text for DOM work.",
		"Line three with links [[Example" + index + "]] and [[Project" + (index % 10) + "]]."
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
