/*\
title: $:/perf/tests/deep-transclusion-stack.js
type: application/javascript
tags: [[$:/tags/performance-test]]

Measures render and refresh paths for deep transclusion stacks.

\*/
"use strict";

exports.name = "deep-transclusion-stack";
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
		basePrefix = "$:/temp/perftest/deep-transclusion/",
		renderTitle = basePrefix + "source",
		unrelatedTitle = basePrefix + "unrelated",
		nodePrefix = basePrefix + "node-",
		itemPrefix = basePrefix + "item-",
		depth = 16,
		itemCount = 40,
		renderMeasurement,
		unrelatedMeasurement,
		relatedMeasurement,
		rendered,
		unrelatedCounter = 0,
		relatedCounter = 0;

	setResilientRenderMode(wiki,mode);
	seedFixture(wiki,nodePrefix,itemPrefix,depth,itemCount);
	wiki.addTiddler({title: renderTitle, text: makeSourceText(itemPrefix,itemCount)});

	renderMeasurement = context.measure("initial-render",function() {
		rendered = context.renderText("{{" + renderTitle + "}}\n");
		return {
			mode: mode,
			phase: "render",
			taxonomy: "render",
			scenarioId: "deep-transclusion-initial-render",
			scenarioTags: ["first-paint","deep-transclusion","widget-tree-build"],
			scenarioChangeRelation: "none",
			scenarioDescription: "Open a view that renders repeated deep transclusion stacks.",
			fixtureName: "deep-transclusion-stack",
			fixtureDepth: depth,
			fixtureItemCount: itemCount,
			petName: "deep transclusion stack",
			domNodeCountAfter: context.countDomNodes(rendered.wrapper)
		};
	});

	unrelatedMeasurement = context.measure("refresh-unrelated-change",function() {
		var before = context.countDomNodes(rendered.wrapper);
		wiki.addTiddler({title: unrelatedTitle, text: "unrelated-" + mode + "-" + unrelatedCounter++});
		context.refresh(rendered.widgetNode,wiki.changedTiddlers,rendered.wrapper);
		wiki.clearTiddlerEventQueue();
		return {
			mode: mode,
			phase: "refresh",
			taxonomy: "refresh",
			scenarioId: "deep-transclusion-refresh-unrelated-change",
			scenarioTags: ["background-edit","deep-transclusion","non-visible-change"],
			scenarioChangeRelation: "unrelated",
			scenarioDescription: "Edit a non-visible tiddler while deep transclusions stay on screen.",
			fixtureName: "deep-transclusion-stack",
			fixtureDepth: depth,
			fixtureItemCount: itemCount,
			petName: "deep transclusion stack",
			changedTiddlerCount: 1,
			domNodeCountBefore: before,
			domNodeCountAfter: context.countDomNodes(rendered.wrapper)
		};
	});

	relatedMeasurement = context.measure("refresh-relevant-change",function() {
		var before = context.countDomNodes(rendered.wrapper);
		wiki.addTiddler({title: nodePrefix + (depth - 1), text: "leaf-" + mode + "-" + relatedCounter++});
		context.refresh(rendered.widgetNode,wiki.changedTiddlers,rendered.wrapper);
		wiki.clearTiddlerEventQueue();
		return {
			mode: mode,
			phase: "refresh",
			taxonomy: "refresh",
			scenarioId: "deep-transclusion-refresh-relevant-change",
			scenarioTags: ["in-view-edit","deep-transclusion","transclusion-refresh"],
			scenarioChangeRelation: "relevant",
			scenarioDescription: "Edit the deepest transcluded node that is visible in the active view.",
			fixtureName: "deep-transclusion-stack",
			fixtureDepth: depth,
			fixtureItemCount: itemCount,
			petName: "deep transclusion stack",
			changedTiddlerCount: 1,
			domNodeCountBefore: before,
			domNodeCountAfter: context.countDomNodes(rendered.wrapper)
		};
	});

	rendered.widgetNode.destroy();
	cleanupFixture(wiki,basePrefix,nodePrefix,itemPrefix,renderTitle,depth,itemCount);
	restoreResilientRenderMode(wiki,configTitle,originalConfig);
	wiki.clearTiddlerEventQueue();
	return [renderMeasurement,unrelatedMeasurement,relatedMeasurement];
}

function seedFixture(wiki,nodePrefix,itemPrefix,depth,itemCount) {
	for(var i = depth - 1; i >= 0; i--) {
		var text = i === depth - 1 ? "leaf-stable" : "{{" + nodePrefix + (i + 1) + "}}";
		wiki.addTiddler({title: nodePrefix + i, text: text});
	}
	for(var j = 0; j < itemCount; j++) {
		wiki.addTiddler({title: itemPrefix + j, text: "Item " + j + ": {{" + nodePrefix + "0}}"});
	}
}

function cleanupFixture(wiki,basePrefix,nodePrefix,itemPrefix,renderTitle,depth,itemCount) {
	wiki.deleteTiddler(renderTitle);
	wiki.deleteTiddler(basePrefix + "unrelated");
	for(var i = 0; i < depth; i++) {
		wiki.deleteTiddler(nodePrefix + i);
	}
	for(var j = 0; j < itemCount; j++) {
		wiki.deleteTiddler(itemPrefix + j);
	}
}

function makeSourceText(itemPrefix,itemCount) {
	var text = ["<$list filter=\"[prefix[" + itemPrefix + "]] +[sort[]]\">","<div class=\"perf-deep-stack-row\"><$view field=\"text\"/></div>","</$list>"];
	if(itemCount === 0) {
		return "";
	}
	return text.join("\n");
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
