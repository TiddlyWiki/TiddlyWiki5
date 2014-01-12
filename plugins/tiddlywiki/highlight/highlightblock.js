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
				var self = this,
						lang = this.domNodes[0].getElementsByTagName('code')[0].className,
						hljs = require("$:/plugins/tiddlywiki/highlight/highlight.js").hljs;

				if($tw.browser && lang !== 'no-highlight') {
						hljs.tabReplace = '    ';
						hljs.highlightBlock(this.domNodes[0]);
				}
		};

})();
