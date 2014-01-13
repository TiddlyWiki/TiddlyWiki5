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

		CodeBlockWidget.prototype.render = function(parent,nextSibling) {
			var hljs, lang;

			this.parentDomNode = parent;
			this.computeAttributes();
			this.execute();
			var codeNode = this.document.createElement("code");
			if(this.getAttribute("language")) {
				lang = this.getAttribute("language");
			}

			var domNode = this.document.createElement("pre");
			codeNode.appendChild(this.document.createTextNode(this.getAttribute("code")));
			domNode.appendChild(codeNode);
			parent.insertBefore(domNode,nextSibling);
			this.domNodes.push(domNode);

			if($tw.browser && lang !== 'no-highlight') {
					hljs = require("$:/plugins/tiddlywiki/highlight/highlight.js").hljs,
					hljs.tabReplace = '    ';
					hljs.highlightBlock(domNode);
			}
		};

})();
