/*\
title: $:/perf/tests/failure-storm.js
type: application/javascript
tags: [[$:/tags/performance-test]]

Measures repeated contained failures in the resilient render boundary.

\*/
"use strict";

exports.name = "failure-storm-resilient-render";
exports.platform = "both";

exports.run = function(context) {
	var measurements = [],
		wiki = context.wiki,
		configTitle = "$:/config/ResilientRender",
		originalConfig = wiki.getTiddler(configTitle);
	wiki.addTiddler({title: configTitle, text: "yes"});
	try {
		measurements.push(runRenderStorm(context));
		measurements.push(runRefreshStorm(context));
	} finally {
		restoreResilientRenderMode(wiki,configTitle,originalConfig);
		wiki.clearTiddlerEventQueue();
	}
	return measurements;
};

function runRenderStorm(context) {
	var wiki = context.wiki,
		basePrefix = "$:/temp/perftest/failure-storm/render/",
		renderTitle = basePrefix + "source",
		itemCount = 80,
		failureEvery = 5,
		failureCount = Math.floor(itemCount / failureEvery),
		rendered,
		measurement;
	wiki.addTiddler({title: renderTitle, text: makeSourceText("render","",itemCount,failureEvery)});
	measurement = context.measure("render-failure-storm",function() {
		rendered = context.renderText("{{" + renderTitle + "}}\n");
		return {
			mode: "yes",
			phase: "render",
			taxonomy: "failure-storm",
			scenarioId: "failure-storm-render",
			scenarioTags: ["resilience","contained-error","failure-storm","first-paint"],
			scenarioChangeRelation: "none",
			scenarioDescription: "Render many sibling widgets with sparse child failures while resilient render containment is enabled.",
			fixtureName: "failure-storm",
			fixtureItemCount: itemCount,
			failureEvery: failureEvery,
			failureCount: failureCount,
			warningsSuppressed: false,
			warningGateExpected: true,
			petName: "failure storm render",
			domNodeCountAfter: context.countDomNodes(rendered.wrapper)
		};
	});
	if(rendered) {
		rendered.widgetNode.destroy();
	}
	wiki.deleteTiddler(renderTitle);
	wiki.clearTiddlerEventQueue();
	return measurement;
}

function runRefreshStorm(context) {
	var wiki = context.wiki,
		basePrefix = "$:/temp/perftest/failure-storm/refresh/",
		renderTitle = basePrefix + "source",
		triggerTitle = basePrefix + "trigger",
		itemCount = 80,
		failureEvery = 5,
		failureCount = Math.floor(itemCount / failureEvery),
		rendered,
		before,
		measurement;
	wiki.addTiddler({title: renderTitle, text: makeSourceText("refresh",triggerTitle,itemCount,failureEvery)});
	rendered = context.renderText("{{" + renderTitle + "}}\n");
	before = context.countDomNodes(rendered.wrapper);
	wiki.addTiddler({title: triggerTitle, text: String(Math.random())});
	measurement = context.measure("refresh-failure-storm",function() {
		context.refresh(rendered.widgetNode,wiki.changedTiddlers,rendered.wrapper);
		wiki.clearTiddlerEventQueue();
		return {
			mode: "yes",
			phase: "refresh",
			taxonomy: "failure-storm",
			scenarioId: "failure-storm-refresh",
			scenarioTags: ["resilience","contained-error","failure-storm","live-update"],
			scenarioChangeRelation: "relevant",
			scenarioDescription: "Refresh many sibling widgets with sparse child failures while resilient render containment is enabled.",
			fixtureName: "failure-storm",
			fixtureItemCount: itemCount,
			failureEvery: failureEvery,
			failureCount: failureCount,
			warningsSuppressed: false,
			warningGateExpected: true,
			petName: "failure storm refresh",
			changedTiddlerCount: 1,
			domNodeCountBefore: before,
			domNodeCountAfter: context.countDomNodes(rendered.wrapper)
		};
	});
	rendered.widgetNode.destroy();
	wiki.deleteTiddler(renderTitle);
	wiki.deleteTiddler(triggerTitle);
	wiki.clearTiddlerEventQueue();
	return measurement;
}

function makeSourceText(throwPhase,triggerTitle,itemCount,failureEvery) {
	var text = [];
	for(var i = 0; i < itemCount; i++) {
		if(i % failureEvery === 0) {
			text.push("<$failurestorm throwPhase=\"" + throwPhase + "\" triggerTitle=\"" + triggerTitle + "\" message=\"failure storm " + throwPhase + "\"/>");
		} else {
			text.push("<span class=\"tc-perf-failurestorm-row\">stable " + i + "</span>");
		}
	}
	return text.join("\n");
}

function restoreResilientRenderMode(wiki,configTitle,originalConfig) {
	if(originalConfig) {
		wiki.addTiddler(originalConfig);
	} else {
		wiki.deleteTiddler(configTitle);
	}
}
