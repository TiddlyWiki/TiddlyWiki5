/*\
title: $:/perf/tests/draft-gradient.js
type: application/javascript
tags: [[$:/tags/performance-test]]

Measures an ordinary editor input flowing through the wiki change queue into a local preview.

\*/

"use strict";

exports.name = "draft-gradient-live-preview";
exports.platform = "browser";
exports.warmup = 2;
exports.iterations = 20;

var nextCase = 0;

exports.run = function(context) {
	var wiki = context.wiki,
		draftTitle = "$:/temp/perftest/draft-gradient/draft",
		originalTitle = "$:/temp/perftest/draft-gradient/original",
		cases = [
			{text: "before <<unfinished", rendered: "before <<unfinished"},
			{text: "before [[unfinished", rendered: "before [[unfinished"},
			{text: "before <$text text=\"unfinished", rendered: "before <$text text=\"unfinished"},
			{text: "before <$list filter={{{ [tag[unfinished]] }}", rendered: "before <$list filter={"}
		],
		rendered,
		measurement;
	wiki.addTiddler({title: originalTitle, type: "text/vnd.tiddlywiki", text: "ordinary source"});
	wiki.addTiddler({
		title: draftTitle,
		type: "text/vnd.tiddlywiki",
		text: cases[0].text,
		"draft.of": originalTitle,
		"draft.title": originalTitle
	});
	rendered = context.renderText(makeSource(draftTitle));
	rendered.wrapper.className = "tc-perf-draft-gradient";
	context.document.body.appendChild(rendered.wrapper);
	measurement = context.measureAsync("draft-preview-refresh",function() {
		var item = cases[nextCase++ % cases.length],
			input = rendered.wrapper.querySelector("textarea"),
			preview = rendered.wrapper.querySelector(".tc-perf-draft-gradient-preview");
		return new Promise(function(resolve,reject) {
			var changeListener = function(changes) {
				if(!changes[draftTitle]) {
					return;
				}
				wiki.removeEventListener("change",changeListener);
				try {
					context.refresh(rendered.widgetNode,changes,rendered.wrapper);
					if(preview.textContent !== item.rendered) {
						throw new Error("Draft preview did not retain the expected base-wikitext recovery text");
					}
					resolve({
						mode: "main",
						phase: "live-preview",
						taxonomy: "editor-preview",
						scenarioId: "draft-gradient-preview",
						scenarioTags: ["browser","edit-text","draft","base-wikitext","gradient"],
						scenarioChangeRelation: "relevant",
						scenarioDescription: "Type incomplete base wikitext into a draft and refresh its local rendered preview.",
						fixtureName: "draft-gradient",
						fixtureItemCount: cases.length,
						petName: "draft gradient live preview",
						gradientCaseCount: cases.length,
						verifiedPreview: true
					});
				} catch(error) {
					reject(error);
				}
			};
			wiki.addEventListener("change",changeListener);
			input.value = item.text;
			input.dispatchEvent(new Event("input",{bubbles: true}));
		});
	}).then(function(result) {
		cleanup(wiki,rendered,draftTitle,originalTitle);
		return result;
	},function(error) {
		cleanup(wiki,rendered,draftTitle,originalTitle);
		throw error;
	});
	return measurement;
};

function makeSource(draftTitle) {
	return [
		"<$edit-text tiddler=\"" + draftTitle + "\" class=\"tc-perf-draft-gradient-input\" autoHeight=\"no\"/>",
		"<div class=\"tc-perf-draft-gradient-preview\"><$transclude tiddler=\"" + draftTitle + "\"/></div>"
	].join("\n");
}

function cleanup(wiki,rendered,draftTitle,originalTitle) {
	if(rendered) {
		rendered.widgetNode.destroy();
		if(rendered.wrapper.parentNode) {
			rendered.wrapper.parentNode.removeChild(rendered.wrapper);
		}
	}
	wiki.deleteTiddler(draftTitle);
	wiki.deleteTiddler(originalTitle);
	wiki.clearTiddlerEventQueue();
}
