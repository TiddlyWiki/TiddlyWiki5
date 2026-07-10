/*\
title: $:/perf/tests/medium-child-walk.js
type: application/javascript
tags: [[$:/tags/performance-test]]

Measures the widget child walk with many moderate children and no intentional errors.

\*/
"use strict";

exports.name = "medium-child-walk";
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
		basePrefix = "$:/temp/perftest/medium-child-walk/",
		itemPrefix = basePrefix + "item-",
		unrelatedTitle = basePrefix + "unrelated",
		childCount = 240,
		parser,
		rendered,
		renderMeasurement,
		unrelatedMeasurement,
		relatedMeasurement,
		unrelatedCounter = 0,
		relatedCounter = 0;

	setResilientRenderMode(wiki,mode);
	seedFixture(wiki,itemPrefix,childCount);
	wiki.clearTiddlerEventQueue();
	parser = {tree: makeMediumChildren(itemPrefix,childCount)};

	renderMeasurement = context.measure("medium-child-render",function() {
		rendered = renderParser(context,parser);
		return {
			mode: mode,
			phase: "render",
			taxonomy: "child-walk",
			scenarioId: "medium-child-walk-render",
			scenarioTags: ["child-walk","base-widget","first-paint","moderate-children"],
			scenarioChangeRelation: "none",
			scenarioDescription: "Render many direct children that each contain nested elements, attributes, and one transclusion.",
			fixtureName: "medium-child-walk",
			fixtureItemCount: childCount,
			petName: "medium child walk",
			domNodeCountAfter: context.countDomNodes(rendered.wrapper)
		};
	});

	unrelatedMeasurement = context.measure("medium-child-refresh-unrelated",function() {
		var before = context.countDomNodes(rendered.wrapper);
		wiki.addTiddler({title: unrelatedTitle, text: "medium-child-walk-" + mode + "-" + unrelatedCounter++});
		context.refresh(rendered.widgetNode,wiki.changedTiddlers,rendered.wrapper);
		wiki.clearTiddlerEventQueue();
		return {
			mode: mode,
			phase: "refresh",
			taxonomy: "child-walk",
			scenarioId: "medium-child-walk-refresh-unrelated",
			scenarioTags: ["child-walk","base-widget","background-edit","moderate-children"],
			scenarioChangeRelation: "unrelated",
			scenarioDescription: "Refresh many moderate children after a tiddler outside the rendered view changes.",
			fixtureName: "medium-child-walk",
			fixtureItemCount: childCount,
			petName: "medium child walk",
			changedTiddlerCount: 1,
			domNodeCountBefore: before,
			domNodeCountAfter: context.countDomNodes(rendered.wrapper)
		};
	});

	relatedMeasurement = context.measure("medium-child-refresh-relevant",function() {
		var before = context.countDomNodes(rendered.wrapper);
		wiki.addTiddler({title: itemPrefix + Math.floor(childCount / 2), text: makeItemText(Math.floor(childCount / 2),relatedCounter++)});
		context.refresh(rendered.widgetNode,wiki.changedTiddlers,rendered.wrapper);
		wiki.clearTiddlerEventQueue();
		return {
			mode: mode,
			phase: "refresh",
			taxonomy: "child-walk",
			scenarioId: "medium-child-walk-refresh-relevant",
			scenarioTags: ["child-walk","base-widget","in-view-edit","moderate-children"],
			scenarioChangeRelation: "relevant",
			scenarioDescription: "Refresh many moderate children after one visible transcluded tiddler changes.",
			fixtureName: "medium-child-walk",
			fixtureItemCount: childCount,
			petName: "medium child walk",
			changedTiddlerCount: 1,
			domNodeCountBefore: before,
			domNodeCountAfter: context.countDomNodes(rendered.wrapper)
		};
	});

	rendered.widgetNode.destroy();
	cleanupFixture(wiki,itemPrefix,unrelatedTitle,childCount);
	restoreResilientRenderMode(wiki,configTitle,originalConfig);
	wiki.clearTiddlerEventQueue();
	return [renderMeasurement,unrelatedMeasurement,relatedMeasurement];
}

function renderParser(context,parser) {
	var widgetNode = context.wiki.makeWidget(parser,{document: context.document}),
		wrapper = context.document.createElement("div");
	widgetNode.render(wrapper,null);
	return {widgetNode: widgetNode, wrapper: wrapper};
}

function seedFixture(wiki,itemPrefix,childCount) {
	for(var i = 0; i < childCount; i++) {
		wiki.addTiddler({title: itemPrefix + i, text: makeItemText(i,0)});
	}
}

function cleanupFixture(wiki,itemPrefix,unrelatedTitle,childCount) {
	wiki.deleteTiddler(unrelatedTitle);
	for(var i = 0; i < childCount; i++) {
		wiki.deleteTiddler(itemPrefix + i);
	}
}

function makeItemText(index,revision) {
	return "Item " + index + " revision " + revision + " with ''bold'' and //italic// text.";
}

function makeMediumChildren(itemPrefix,childCount) {
	var children = [];
	for(var i = 0; i < childCount; i++) {
		children.push({
			type: "element",
			tag: "div",
			attributes: {
				"class": {type: "string", value: "perf-medium-row"},
				"data-index": {type: "string", value: String(i)},
				"title": {type: "indirect", textReference: itemPrefix + i}
			},
			children: [
				{type: "element", tag: "span", attributes: {
					"class": {type: "string", value: "perf-medium-label"}
				}, children: [
					{type: "text", text: "Medium row " + i + ": "}
				]},
				{type: "transclude", attributes: {
					"tiddler": {type: "string", value: itemPrefix + i}
				}},
				{type: "element", tag: "span", attributes: {
					"class": {type: "string", value: "perf-medium-tail"}
				}, children: [
					{type: "text", text: " stable tail"}
				]}
			]
		});
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
