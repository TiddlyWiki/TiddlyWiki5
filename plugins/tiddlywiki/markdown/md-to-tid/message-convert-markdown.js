/*\
title: $:/plugins/tiddlywiki/markdown/md-to-tid/message-convert-markdown.js
type: application/javascript
module-type: startup

Register tm-convert-markdown message to convert markdown tiddler to wikitext
\*/

"use strict";

exports.name = "convert-markdown-message";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

exports.startup = function() {
	$tw.rootWidget.addEventListener("tm-convert-markdown",function(event) {
		var tiddlerTitle = event.param || event.tiddlerTitle;
		if(!tiddlerTitle) return;
		var wiki = $tw.wiki;
		var tiddler = wiki.getTiddler(tiddlerTitle);
		if(!tiddler) return;
		var type = tiddler.fields.type || "text/vnd.tiddlywiki";
		if(type !== "text/x-markdown" && type !== "text/markdown") return;
		if(!$tw.utils.markdownTextToWikiAST) return;
		try {
			var markdownText = tiddler.fields.text || "";
			var wikiAST = $tw.utils.markdownTextToWikiAST(markdownText);
			var wikitext = $tw.utils.serializeWikitextParseTree(wikiAST);
			wiki.addTiddler(new $tw.Tiddler(
				tiddler,
				{
					text: wikitext,
					type: "text/vnd.tiddlywiki"
				}
			));
			$tw.rootWidget.dispatchEvent({
				type: "tm-notify",
				param: "$:/plugins/tiddlywiki/markdown/md-to-tid/language/en-GB/Notifications/ConvertSuccess",
				targetTiddler: tiddlerTitle
			});
		} catch(e) {
			console.error("Error converting markdown:", e);
			$tw.rootWidget.dispatchEvent({
				type: "tm-notify",
				param: "$:/plugins/tiddlywiki/markdown/md-to-tid/language/en-GB/Notifications/ConvertFailure",
				targetTiddler: tiddlerTitle
			});
		}
	});
};
