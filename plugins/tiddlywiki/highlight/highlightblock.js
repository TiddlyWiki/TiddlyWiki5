/*\
title: $:/plugins/tiddlywiki/highlight/highlightblock.js
type: application/javascript
module-type: widget

Wraps up the fenced code blocks parser for highlight and use in TiddlyWiki5

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var CodeBlockWidget = require("$:/core/modules/widgets/codeblock.js").codeblock;

CodeBlockWidget.prototype.postRender = function() {
	var domNode = this.domNodes[0];
	if($tw.browser && this.document !== $tw.fakeDocument && this.language) {
		domNode.className = this.language.toLowerCase();
		var hljs = require("$:/plugins/tiddlywiki/highlight/highlight.js").hljs;
		hljs.tabReplace = "    ";
		hljs.highlightBlock(domNode);
	}
};

})();
