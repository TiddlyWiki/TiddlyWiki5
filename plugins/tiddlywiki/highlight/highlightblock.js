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

var TYPE_MAPPINGS_BASE = "$:/config/HighlightPlugin/TypeMappings/";

var CodeBlockWidget = require("$:/core/modules/widgets/codeblock.js").codeblock;

var hljs = require("$:/plugins/tiddlywiki/highlight/highlight.js");

hljs.configure({tabReplace: "    "});	

CodeBlockWidget.prototype.postRender = function() {
	var domNode = this.domNodes[0],
		language = this.language,
		tiddler = this.wiki.getTiddler(TYPE_MAPPINGS_BASE + language);
	if(tiddler) {
		language = tiddler.fields.text || "";
	}
	if($tw.browser && this.document !== $tw.fakeDocument && language) {
		domNode.className = language.toLowerCase();
		hljs.highlightBlock(domNode);
	} else if(!$tw.browser && language && language.indexOf("/") === -1 ){
		try {
			domNode.className = language.toLowerCase() + " hljs";
			domNode.children[0].innerHTML = hljs.fixMarkup(hljs.highlight(language, this.getAttribute("code")).value);
		}
		catch(err) {
			// Can't easily tell if a language is registered or not in the packed version of hightlight.js,
			// so we silently fail and the codeblock remains unchanged
		}
	}	
};

})();
