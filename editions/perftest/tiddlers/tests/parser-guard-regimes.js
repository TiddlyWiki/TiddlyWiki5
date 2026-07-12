/*\
title: $:/perf/tests/parser-guard-regimes.js
type: application/javascript
tags: [[$:/tags/performance-test]]

Separates the regimes in which an unclosed-delimiter guard changes the cost of parsing, since averaging them hides both the cost and the saving.

Well formed source pays the guard's forward scan and gains nothing. Malformed source pays the scan once and then skips parsing the remainder of the tiddler as an inline run, so it should read faster. Adversarial source, carrying many openers that never close, makes every opener scan to the end of the source, so it hunts the quadratic worst case the guard introduces.

\*/

"use strict";

exports.name = "parser-guard-regimes";
exports.platform = "both";
exports.warmup = 10;
exports.iterations = 500;

exports.run = function(context) {
	var inputs = makeInputs(),
		measurements = [];
	for(var i = 0; i < inputs.length; i++) {
		measurements.push(measureParse(context,inputs[i]));
	}
	return measurements;
};

function measureParse(context,input) {
	var wiki = context.wiki,
		text = input.text;
	return context.measure(input.id,function() {
		wiki.parseText("text/vnd.tiddlywiki",text);
		return {
			mode: "main",
			phase: "parse",
			taxonomy: "text-to-parse-tree",
			scenarioId: input.id,
			scenarioDescription: input.description,
			fixtureName: "parser-guard-regimes",
			petName: input.id,
			inputBytes: text.length,
			regime: input.regime,
			prediction: input.prediction
		};
	});
}

function makeInputs() {
	return [
		{
			id: "parse-well-formed",
			regime: "well-formed",
			prediction: "null: the guard scans to a closer that arrives quickly and gains nothing",
			description: "Emphasis-rich prose in which every delimiter closes.",
			text: makeWellFormed(60)
		},
		{
			id: "parse-plain-blocks",
			regime: "control",
			prediction: "null: no delimiter appears, so only the block recovery scaffolding can charge for this",
			description: "Block-dense prose carrying no delimiter of any kind, which isolates the cost of the recovery scaffolding from the cost of the rules.",
			text: makePlain(60)
		},
		{
			id: "parse-malformed-single",
			regime: "malformed",
			prediction: "cost: the rule parses the tail, finds no closer, rewinds and parses the tail again",
			description: "One stray opener ahead of a large body that carries no delimiter of any kind, so the opener truly never closes.",
			text: "A paragraph opening ''unclosed emphasis.\n\n" + makePlain(60)
		},
		{
			id: "parse-adversarial-many",
			regime: "adversarial",
			prediction: "worst case: a second opener of the same kind closes the first, so only one opener of each kind can go unclosed",
			description: "One unclosed opener of every delimiter kind ahead of a large plain body, which bounds the rewind cost at one re-parse per kind.",
			text: makeAdversarial()
		}
	];
}

function makeWellFormed(count) {
	var lines = [];
	for(var i = 0; i < count; i++) {
		lines.push("A paragraph carrying ''bold " + i + "'', //italic " + i + "//, __underscore__, ~~struck~~ and `code " + i + "`.");
		lines.push("");
	}
	return lines.join("\n");
}

// The filler carries no delimiter character, so nothing downstream can close an opener by accident
function makePlain(count) {
	var lines = [];
	for(var i = 0; i < count; i++) {
		lines.push("!! Heading " + i);
		lines.push("A plain paragraph of prose numbered " + i + " that carries no delimiter at all.");
		lines.push("* first item " + i);
		lines.push("* second item " + i);
		lines.push("");
	}
	return lines.join("\n");
}

// A second opener of a kind closes the first, so at most one opener of each kind can go unclosed and the rewind cost stays bounded
function makeAdversarial() {
	var openers = ["''","//","__","~~","^^",",,"],
		lines = [];
	for(var i = 0; i < openers.length; i++) {
		lines.push("Block " + i + " opens " + openers[i] + "an emphasis that never closes.");
		lines.push("");
	}
	return lines.join("\n") + "\n" + makePlain(60);
}
