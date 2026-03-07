/*\
title: test-markdown-to-wikitext.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests markdown to wikitext conversion.

\*/

const DataWidget = require("$:/core/modules/widgets/data.js").data;

describe("Markdown to Wikitext conversion tests", function() {
	// Check if markdown conversion is available
	if(!$tw.utils.markdownTextToWikiAST) {
		pending("Markdown conversion not available (markdown plugin may not be installed)");
		return;
	}
	const cases = $tw.wiki.filterTiddlers("[all[shadows+tiddlers]tag[$:/tags/markdown-to-wikitext-test-spec]]");
	$tw.utils.each(cases, function(title) {
		it("should convert markdown to wikitext correctly for " + title, function() {
			// Extract sub-tiddlers from compound tiddler using DataWidget
			const dataWidget = new DataWidget({}, {
				wiki: $tw.wiki,
				document: $tw.fakeDocument
			});
			const tiddlers = dataWidget.extractCompoundTiddler(title);
			if(tiddlers.length === 0) {
				throw new Error("Test tiddler " + title + " must be of type text/vnd.tiddlywiki-multiple");
			}
			const wikiAST = $tw.utils.markdownTextToWikiAST(tiddlers[0].fields.text || "");
			const wikitext = $tw.utils.serializeWikitextParseTree(wikiAST);
			// Trim trailing whitespace for comparison
			expect(wikitext.trimEnd()).toBe((tiddlers[1].fields.text || "").trimEnd());
		});
	});
});
