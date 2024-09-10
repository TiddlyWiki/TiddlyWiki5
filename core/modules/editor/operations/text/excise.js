/*\
title: $:/core/modules/editor/operations/text/excise.js
type: application/javascript
module-type: texteditoroperation

Text editor operation to excise the selection to a new tiddler

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function isMarkdown(mediaType) {
	return mediaType === 'text/markdown' || mediatype === 'text/x-markdown';
}

exports["excise"] = function(event,operation) {
	var editTiddler = this.wiki.getTiddler(this.editTitle),
		editTiddlerTitle = this.editTitle,
		wikiLinks = !isMarkdown(editTiddler.fields.type),
		excisionBaseTitle = $tw.language.getString("Buttons/Excise/DefaultTitle");
	if(editTiddler && editTiddler.fields["draft.of"]) {
		editTiddlerTitle = editTiddler.fields["draft.of"];
	}
	var excisionTitle = event.paramObject.title || this.wiki.generateNewTitle(excisionBaseTitle);
	this.wiki.addTiddler(new $tw.Tiddler(
		this.wiki.getCreationFields(),
		this.wiki.getModificationFields(),
		{
			title: excisionTitle,
			text: operation.selection,
			tags: event.paramObject.tagnew === "yes" ?  [editTiddlerTitle] : [],
			type: editTiddler.fields.type
		}
	));
	operation.replacement = excisionTitle;
	switch(event.paramObject.type || "transclude") {
		case "transclude":
			operation.replacement = "{{" + operation.replacement+ "}}";
			break;
		case "link":
			operation.replacement = wikiLinks ? "[[" + operation.replacement+ "]]"
				: ("[" + operation.replacement + "](<#" + operation.replacement + ">)");
			break;
		case "macro":
			operation.replacement = "<<" + (event.paramObject.macro || "translink") + " \"\"\"" + operation.replacement + "\"\"\">>";
			break;
	}
	operation.cutStart = operation.selStart;
	operation.cutEnd = operation.selEnd;
	operation.newSelStart = operation.selStart;
	operation.newSelEnd = operation.selStart + operation.replacement.length;
};

})();
