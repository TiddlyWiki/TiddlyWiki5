/*\
title: $:/perf/tests/hot-child-walk.js
type: application/javascript
tags: [[$:/tags/performance-test]]

Measures the base widget child walk with many simple children.

\*/
"use strict";

exports.name = "hot-child-walk";
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
		unrelatedTitle = "$:/temp/perftest/hot-child-walk/unrelated",
		childCount = 1000,
		parser = {tree: makeTextChildren(childCount)},
		rendered,
		renderMeasurement,
		refreshMeasurement,
		refreshCounter = 0;

	setResilientRenderMode(wiki,mode);
	wiki.clearTiddlerEventQueue();

	renderMeasurement = context.measure("direct-child-render",function() {
		rendered = renderParser(context,parser);
		return {
			mode: mode,
			phase: "render",
			taxonomy: "child-walk",
			scenarioId: "hot-child-walk-render",
			scenarioTags: ["child-walk","base-widget","first-paint"],
			scenarioChangeRelation: "none",
			scenarioDescription: "Render a direct parse tree with many simple text children.",
			fixtureName: "hot-child-walk",
			fixtureItemCount: childCount,
			petName: "hot child walk",
			domNodeCountAfter: context.countDomNodes(rendered.wrapper)
		};
	});

	refreshMeasurement = context.measure("direct-child-refresh",function() {
		var before = context.countDomNodes(rendered.wrapper);
		wiki.addTiddler({title: unrelatedTitle, text: "hot-child-walk-" + mode + "-" + refreshCounter++});
		context.refresh(rendered.widgetNode,wiki.changedTiddlers,rendered.wrapper);
		wiki.clearTiddlerEventQueue();
		return {
			mode: mode,
			phase: "refresh",
			taxonomy: "child-walk",
			scenarioId: "hot-child-walk-refresh",
			scenarioTags: ["child-walk","base-widget","background-edit"],
			scenarioChangeRelation: "unrelated",
			scenarioDescription: "Refresh a rendered widget with many simple children after an unrelated change.",
			fixtureName: "hot-child-walk",
			fixtureItemCount: childCount,
			petName: "hot child walk",
			changedTiddlerCount: 1,
			domNodeCountBefore: before,
			domNodeCountAfter: context.countDomNodes(rendered.wrapper)
		};
	});

	rendered.widgetNode.destroy();
	wiki.deleteTiddler(unrelatedTitle);
	restoreResilientRenderMode(wiki,configTitle,originalConfig);
	wiki.clearTiddlerEventQueue();
	return [renderMeasurement,refreshMeasurement];
}

function renderParser(context,parser) {
	var widgetNode = context.wiki.makeWidget(parser,{document: context.document}),
		wrapper = context.document.createElement("div");
	widgetNode.render(wrapper,null);
	return {widgetNode: widgetNode, wrapper: wrapper};
}

function makeTextChildren(childCount) {
	var children = [];
	for(var i = 0; i < childCount; i++) {
		children.push({type: "text", text: "x"});
	}
	return children;
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
