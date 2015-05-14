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
//register languages requires hljs for us
var hljs = require("$:/plugins/tiddlywiki/highlight/registerlanguages.js").hljs;
hljs.configure({tabReplace: "    "});	

CodeBlockWidget.prototype.postRender = function() {
	var domNode = this.domNodes[0];
	if($tw.browser && this.document !== $tw.fakeDocument && this.language) {
		domNode.className = this.language.toLowerCase();
		hljs.highlightBlock(domNode);
	}
	else if(!$tw.browser && this.language && this.language.indexOf("/") == -1 ){
		try{
			domNode.className = this.language.toLowerCase() + " hljs";
			domNode.children[0].innerHTML = hljs.fixMarkup(hljs.highlight(this.language, this.getAttribute("code")).value);
		}
		catch(err) {
			//can't easily tell if a language is registered or not in the packed version of hightlight.js
			//so we silently fail and the codeblock remains unchanged
		}
	}	
};

})();
