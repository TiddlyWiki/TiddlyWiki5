/*\
title: $:/plugins/tiddlywiki/highlight/highlightblock.js
type: application/javascript
module-type: widget

Wraps up the fenced code blocks parser for highlight and use in TiddlyWiki5

\*/
"use strict";

var TYPE_MAPPINGS_BASE = "$:/config/HighlightPlugin/TypeMappings/";

var CodeBlockWidget = require("$:/core/modules/widgets/codeblock.js").codeblock;

var hljs = require("$:/plugins/tiddlywiki/highlight/highlight.js");

if(hljs.getLanguage !== undefined) {
	// load language definitions
	$tw.utils.each($tw.modules.types["highlight"],function(moduleInfo,moduleName) {
		$tw.utils.evalSandboxed(moduleInfo.definition,{hljs:hljs, exports:{}},moduleName);
	});
	
	CodeBlockWidget.prototype.postRender = function() {
		var domNode = this.domNodes[0],
			language = this.language,
			tiddler = this.wiki.getTiddler(TYPE_MAPPINGS_BASE + language);
		if(tiddler) {
			language = tiddler.fields.text || "";
		}
		if(language && hljs.getLanguage(language)) {
			domNode.className = "hljs";
			domNode.children[0].className = language.toLowerCase() + " hljs";
			if($tw.browser && !domNode.isTiddlyWikiFakeDom) {
				hljs.highlightElement(domNode.children[0]);
			} else {
				var text = domNode.textContent;
				domNode.children[0].innerHTML = hljs.highlight(text,{language: language, ignoreIllegals: true}).value;
				// If we're using the fakedom then specially save the original raw text
				if(domNode.isTiddlyWikiFakeDom) {
					domNode.children[0].textInnerHTML = text;
				}
			}
		}
	};
}
