/*\
title: $:/core/modules/parsers/wikitextparser/rules/image.js
type: application/javascript
module-type: wikitextrule

Wiki text run rule for images. For example:

{{{
[img[MyPicture]]
}}}

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "image";

exports.runParser = true;

exports.regExpString = "\\[(?:[<>]?)[Ii][Mm][Gg]\\[(?:(?:[^\\|\\]]+)\\|)?(?:[^\\[\\]\\|]+)\\](?:\\[(?:[^\\]]*)\\])?\\]";

exports.parse = function(match,isBlock) {
	var regExp = /\[([<>]?)[Ii][Mm][Gg]\[(?:([^\|\]]+)\|)?([^\[\]\|]+)\](?:\[([^\]]*)\])?\]/mg;
	regExp.lastIndex = this.pos;
	match = regExp.exec(this.source);
	if(match && match.index === this.pos) {
		this.pos = match.index + match[0].length;
		var srcParams = {};
		if(match[1] === "<") {
			srcParams.alignment = "left";
		} else if(match[1] === ">") {
			srcParams.alignment = "right";
		}
		if(match[2]) {
			srcParams.text = match[2];
		}
		if(match[3]) {
			srcParams.src = match[3];
		}
		var imageMacroNode = $tw.Tree.Macro("image",{
			srcParams: srcParams,
			wiki: this.wiki
		});
		this.dependencies.mergeDependencies(imageMacroNode.dependencies);
		if(match[4]) {
			var linkMacroNode = $tw.Tree.Macro("link",{
				srcParams: {to: match[4]},
				content: [imageMacroNode],
				wiki: this.wiki
			});
			this.dependencies.mergeDependencies(linkMacroNode.dependencies);
			return [linkMacroNode];
		} else {
			return [imageMacroNode];
		}
	}
	return [];
};

})();
