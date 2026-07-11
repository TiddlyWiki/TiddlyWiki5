/*\
title: $:/perf/tests/parser-resilience.js
type: application/javascript
tags: [[$:/tags/performance-test]]

Measures the main parser path and recoverable source faults without touching the widget child walk.

\*/

"use strict";

exports.name = "parser-resilience";
exports.platform = "both";

exports.run = function(context) {
	var measurements = [],
		wiki = context.wiki,
		failureType = "text/x-perftest-throwing-parser",
		previousParser = $tw.Wiki.parsers[failureType],
		source = makeSource(40),
		tiddlerTitle = "$:/temp/perftest/parser-resilience/source";
	$tw.Wiki.parsers[failureType] = function() {
		throw new $tw.utils.RecoverableParseError({
			code: "perftest-grammar",
			message: "perftest parser failure"
		});
	};
	try {
		wiki.addTiddler({title: tiddlerTitle, type: "text/vnd.tiddlywiki", text: source});
		wiki.clearTiddlerEventQueue();
		measurements.push(measureDirectParse(context,source));
		measurements.push(measureCachedParse(context,tiddlerTitle));
		measurements.push(measureFailureParse(context,failureType,source));
	} finally{
		wiki.deleteTiddler(tiddlerTitle);
		wiki.clearTiddlerEventQueue();
		if(previousParser) {
			$tw.Wiki.parsers[failureType] = previousParser;
		} else {
			delete $tw.Wiki.parsers[failureType];
		}
	}
	return measurements;
};

function measureDirectParse(context,source) {
	var count = 40,
		measurement = context.measure("parser-direct",function() {
			var parser;
			for(var i = 0; i < count; i++) {
				parser = context.wiki.parseText("text/vnd.tiddlywiki",source);
			}
			return {
				mode: "main",
				phase: "parse",
				taxonomy: "parser-main-path",
				scenarioId: "parser-direct",
				scenarioTags: ["parser","direct","success","main-path"],
				scenarioChangeRelation: "none",
				scenarioDescription: "Parse moderate valid wikitext repeatedly through the ordinary parser path.",
				fixtureName: "parser-resilience",
				fixtureItemCount: count,
				petName: "parser direct main path",
				sourceLength: source.length,
				parserTreeSize: parser.tree.length
			};
		});
	return measurement;
}

function measureCachedParse(context,title) {
	var count = 100;
	return context.measure("parser-cached",function() {
		var parser;
		for(var i = 0; i < count; i++) {
			parser = context.wiki.parseTiddler(title);
		}
		return {
			mode: "main",
			phase: "cache",
			taxonomy: "parser-main-path",
			scenarioId: "parser-cached",
			scenarioTags: ["parser","cache","success","main-path"],
			scenarioChangeRelation: "none",
			scenarioDescription: "Read a previously parsed tiddler repeatedly through the ordinary parse cache.",
			fixtureName: "parser-resilience",
			fixtureItemCount: count,
			petName: "parser cached main path",
			parserTreeSize: parser.tree.length
		};
	});
}

function measureFailureParse(context,type,source) {
	var count = 40;
	return context.measure("parser-failure-recoverable",function() {
		var parser;
		for(var i = 0; i < count; i++) {
			parser = context.wiki.parseText(type,source);
		}
		return {
			mode: "main",
			phase: "recovery",
			taxonomy: "parser-main-path",
			scenarioId: "parser-failure-recoverable",
			scenarioTags: ["parser","failure","source-preserving","recoverable"],
			scenarioChangeRelation: "none",
			scenarioDescription: "Recover repeated source faults while retaining the complete source as a text node.",
			fixtureName: "parser-resilience",
			fixtureItemCount: count,
			petName: "parser recoverable source fault",
			sourceLength: source.length,
			preservedSource: parser.tree[0].text === source,
			diagnosticCount: parser.diagnostics.length
		};
	});
}

function makeSource(count) {
	var lines = [];
	for(var i = 0; i < count; i++) {
		lines.push("!! Heading " + i);
		lines.push("A moderate paragraph with [[a link|Target " + i + "]] and ''formatting''.");
	}
	return lines.join("\n");
}
