/*\
title: $:/core/modules/parsers/wikitextparser/rules/typedblock.js
type: application/javascript
module-type: wikitextrule

Wiki text run rule for typed blocks. For example:

{{{
$$$.js
This will be rendered as JavaScript
$$$

$$$.svg
<svg xmlns="http://www.w3.org/2000/svg" width="150" height="100">
  <circle cx="100" cy="50" r="40" stroke="black" stroke-width="2" fill="red" />
</svg>
$$$
}}}

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "typedblock";

exports.blockParser = true;

exports.regExpString = "\\$\\$\\$(?:.*)\\r?\\n";

exports.parse = function(match,isBlock) {
	var startRegExp = /\$\$\$(.*)\r?\n/mg,
		endRegExp = /^(\$\$\$)$/mg;
	startRegExp.lastIndex = this.pos;
	match = startRegExp.exec(this.source);
	if(match) {
		var mimeType = match[1],
			text;
		this.pos = match.index + match[0].length;
		endRegExp.lastIndex = this.pos;
		match = endRegExp.exec(this.source);
		if(match) {
			text = this.source.substring(this.pos,match.index);
			this.pos = match.index + match[0].length;
		} else {
			text = this.source.substr(this.pos);
			this.pos = this.sourceLength;
		}
		var renderer = this.wiki.parseText(mimeType,text,{defaultType: "text/plain"});
		this.dependencies.mergeDependencies(renderer.dependencies);
		return renderer.tree;
	} else {
		return [];
	}
};

})();
