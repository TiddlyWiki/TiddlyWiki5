/*\
title: $:/plugins/tiddlywiki/highlight-legacy/highlightblock.js
type: application/javascript
module-type: widget

Wraps up the fenced code blocks parser for highlight and use in TiddlyWiki5

\*/
"use strict";
const TYPE_MAPPINGS_BASE = "$:/config/HighlightPlugin/TypeMappings/";

const CodeBlockWidget = require("$:/core/modules/widgets/codeblock.js").codeblock;

const hljs = require("$:/plugins/tiddlywiki/highlight-legacy/highlight.js");

hljs.configure({tabReplace: "    "});

CodeBlockWidget.prototype.postRender = function() {
	const domNode = this.domNodes[0];
	let {language} = this;
	const tiddler = this.wiki.getTiddler(TYPE_MAPPINGS_BASE + language);
	if(tiddler) {
		language = tiddler.fields.text || "";
	}
	if(language && hljs.getLanguage(language)) {
		domNode.className = `${language.toLowerCase()} hljs`;
		if($tw.browser && !domNode.isTiddlyWikiFakeDom) {
			hljs.highlightBlock(domNode);
		} else {
			const text = domNode.textContent;
			domNode.children[0].innerHTML = hljs.fixMarkup(hljs.highlight(language,text).value);
			// If we're using the fakedom then specially save the original raw text
			if(domNode.isTiddlyWikiFakeDom) {
				domNode.children[0].textInnerHTML = text;
			}
		}
	}
};
