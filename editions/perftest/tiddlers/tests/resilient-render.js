/*\
title: $:/perf/tests/resilient-render.js
type: application/javascript
tags: [[$:/tags/performance-test]]

Measures render and refresh paths for a synthetic widget tree.

\*/
"use strict";

exports.name = "resilient-render-widget-tree";
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
		renderTitle = "$:/temp/perftest/resilient-render/source",
		relatedTitle = "$:/temp/perftest/resilient-render/item-0",
		unrelatedTitle = "$:/temp/perftest/resilient-render/unrelated",
		text = makeSourceText(80),
		renderMeasurement,
		unrelatedMeasurement,
		relatedMeasurement,
		rendered;
	setResilientRenderMode(wiki,mode);
	wiki.addTiddler({title: renderTitle, text: text});
	for(var i = 0; i < 80; i++) {
		wiki.addTiddler({title: "$:/temp/perftest/resilient-render/item-" + i, text: "item " + i});
	}
	renderMeasurement = context.measure("initial-render",function() {
		rendered = context.renderText("{{" + renderTitle + "}}");
		return {
			mode: mode,
			phase: "render",
			taxonomy: "render",
			scenarioId: "initial-render",
			scenarioTags: ["first-paint","open-view","widget-tree-build"],
			scenarioChangeRelation: "none",
			scenarioDescription: "Open a wiki view and build the initial widget and DOM tree before any edit.",
			fixtureName: "resilient-render",
			fixtureItemCount: 80,
			petName: "resilient render widget tree",
			domNodeCountAfter: context.countDomNodes(rendered.wrapper)
		};
	});
	unrelatedMeasurement = context.measure("refresh-unrelated-change",function() {
		var before = context.countDomNodes(rendered.wrapper);
		wiki.addTiddler({title: unrelatedTitle, text: String(Math.random())});
		context.refresh(rendered.widgetNode,wiki.changedTiddlers,rendered.wrapper);
		wiki.clearTiddlerEventQueue();
		return {
			mode: mode,
			phase: "refresh",
			taxonomy: "refresh",
			scenarioId: "refresh-unrelated-change",
			scenarioTags: ["background-edit","cache-invalidation","non-visible-change"],
			scenarioChangeRelation: "unrelated",
			scenarioDescription: "Edit a tiddler that is not part of the currently visible view; models background changes elsewhere in the wiki.",
			fixtureName: "resilient-render",
			fixtureItemCount: 80,
			petName: "resilient render widget tree",
			changedTiddlerCount: 1,
			domNodeCountBefore: before,
			domNodeCountAfter: context.countDomNodes(rendered.wrapper)
		};
	});
	relatedMeasurement = context.measure("refresh-relevant-change",function() {
		var before = context.countDomNodes(rendered.wrapper);
		wiki.addTiddler({title: relatedTitle, text: String(Math.random())});
		context.refresh(rendered.widgetNode,wiki.changedTiddlers,rendered.wrapper);
		wiki.clearTiddlerEventQueue();
		return {
			mode: mode,
			phase: "refresh",
			taxonomy: "refresh",
			scenarioId: "refresh-relevant-change",
			scenarioTags: ["in-view-edit","visible-content-change","transclusion-refresh"],
			scenarioChangeRelation: "relevant",
			scenarioDescription: "Edit a tiddler that is rendered in the current view; models updating content the user is actively looking at.",
			fixtureName: "resilient-render",
			fixtureItemCount: 80,
			petName: "resilient render widget tree",
			changedTiddlerCount: 1,
			domNodeCountBefore: before,
			domNodeCountAfter: context.countDomNodes(rendered.wrapper)
		};
	});
	rendered.widgetNode.destroy();
	wiki.deleteTiddler(renderTitle);
	wiki.deleteTiddler(unrelatedTitle);
	for(var j = 0; j < 80; j++) {
		wiki.deleteTiddler("$:/temp/perftest/resilient-render/item-" + j);
	}
	restoreResilientRenderMode(wiki,configTitle,originalConfig);
	wiki.clearTiddlerEventQueue();
	return [renderMeasurement,unrelatedMeasurement,relatedMeasurement];
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

function makeSourceText(count) {
	var text = ["<$list filter=\"[prefix[$:/temp/perftest/resilient-render/item-]] +[sort[]]\">"];
	for(var i = 0; i < count; i++) {
		text.push("<$transclude tiddler=\"$:/temp/perftest/resilient-render/item-" + i + "\"/>");
	}
	text.push("</$list>");
	return text.join("\n");
}
