/*\
title: $:/core/modules/language.js
type: application/javascript
module-type: global

The $tw.Language() manages translateable strings

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Create an instance of the language manager. Options include:
wiki: wiki from which to retrieve translation tiddlers
*/
function Language(options) {
	options = options || "";
	this.wiki = options.wiki || $tw.wiki;
}

/*
Return a wikified translateable string. The title is automatically prefixed with "$:/language/"
Options include:
variables: optional hashmap of variables to supply to the language wikification
*/
Language.prototype.getString = function(title,options) {
	options = options || {};
	title = "$:/language/" + title;
	return this.wiki.renderTiddler("text/plain",title,{variables: options.variables});
};

/*
Return a raw, unwikified translateable string. The title is automatically prefixed with "$:/language/"
*/
Language.prototype.getRawString = function(title) {
	title = "$:/language/" + title;
	return this.wiki.getTiddlerText(title);
};

exports.Language = Language;

})();
