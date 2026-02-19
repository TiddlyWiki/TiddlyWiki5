/*\
title: $:/core/modules/language.js
type: application/javascript
module-type: global
\*/

"use strict";

function Language(options) {
	options = options || "";
	this.wiki = options.wiki || $tw.wiki;
}

Language.prototype.getString = function(title,options) {
	options = options || {};
	title = "$:/language/" + title;
	return this.wiki.renderTiddler("text/plain",title,{variables: options.variables});
};

Language.prototype.getRawString = function(title) {
	title = "$:/language/" + title;
	return this.wiki.getTiddlerText(title);
};

exports.Language = Language;
