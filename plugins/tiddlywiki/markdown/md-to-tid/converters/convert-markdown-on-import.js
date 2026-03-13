/*\
title: $:/plugins/tiddlywiki/markdown/md-to-tid/converters/convert-markdown-on-import.js
type: application/javascript
module-type: startup

Convert markdown tiddlers to wikitext during import

\*/

"use strict";

exports.name = "convert-markdown-on-import";
exports.platforms = ["browser"];
exports.after = ["load-modules"];
exports.before = ["story"];
exports.synchronous = true;

exports.startup = function() {
	$tw.hooks.addHook("th-importing-tiddler", function(tiddler) {
		const shouldConvert = $tw.wiki.getTiddlerText("$:/config/md-to-tid/convert-markdown-on-import") === "yes";
		if(!shouldConvert) {
			return tiddler;
		}

		const type = tiddler.fields.type || "text/vnd.tiddlywiki";
		if(type !== "text/x-markdown" && type !== "text/markdown") {
			return tiddler;
		}

		try {
			const markdownText = tiddler.fields.text || "";
			const wikiAST = $tw.utils.markdownTextToWikiAST(markdownText);
			const wikitext = $tw.utils.serializeWikitextParseTree(wikiAST);

			return new $tw.Tiddler(
				tiddler,
				{
					text: wikitext,
					type: "text/vnd.tiddlywiki"
				}
			);
		} catch(e) {
			console.error("Error converting markdown during import:", e);
			return tiddler;
		}
	});
};
