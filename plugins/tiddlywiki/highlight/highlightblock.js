/*\
title: $:/plugins/tiddlywiki/highlight/highlightblock.js
type: application/javascript
module-type: widget

Wraps up the fenced code blocks parser for highlight and use in TiddlyWiki5

\*/
"use strict";

const TYPE_MAPPINGS_BASE = "$:/config/HighlightPlugin/TypeMappings/";

const CodeBlockWidget = require("$:/core/modules/widgets/codeblock.js").codeblock;

const hljs = require("$:/plugins/tiddlywiki/highlight/highlight.js");

if(hljs.getLanguage !== undefined) {
	// load language definitions
	$tw.utils.each($tw.modules.types["highlight"],function(moduleInfo,moduleName) {
		$tw.utils.evalSandboxed(moduleInfo.definition,{hljs:hljs, exports:{}},moduleName);
	});

	// Must use the exact language name registered in highlight.js
	// So set up a map to lookup registered language name
	const LANGUAGE_MAP = new Map();

	for(const lang of hljs.listLanguages()) {
		const dfn = hljs.getLanguage(lang);

		LANGUAGE_MAP.set(lang, lang);
		if(dfn.aliases) {
			for(const alias of dfn.aliases) {
				LANGUAGE_MAP.set(alias, lang);
			}
		}
	}
	LANGUAGE_MAP.set("plain", "plaintext");

	CodeBlockWidget.prototype.postRender = function() {
		function updateInnerHTML(node, text, html, language) {
			node.innerHTML = html;
			node.className = "hljs language-" + language;
			node.setAttribute("data-highlighted","yes");

			if(node.isTiddlyWikiFakeDom) {
				// node effectively contains raw innerHTML, set raw textContent
				node.textInnerHTML = text;
			}
		}

		const domNode = this.domNodes[0];
		const code = domNode.children[0].textContent;

		if(!Boolean(this.language)) {	// auto-detect
			const wordCount = code.trim().split(/\s+/).length || 1;
			let result = hljs.highlightAuto(code, [ "tiddlywiki", "javascript" ]);

			const score = result.relevance / Math.sqrt(wordCount);
			if(score >= 2) {
				updateInnerHTML(domNode.children[0],code,result.value,result.language);
			}
			return;
		}

		let languageName = this.language.toLowerCase();
		let langHLJS = LANGUAGE_MAP.get(languageName);

		if(! langHLJS) {
			const tiddler = this.wiki.getTiddler(TYPE_MAPPINGS_BASE + languageName);

			if(tiddler && tiddler.fields.text) {
				languageName = tiddler.fields.text;
			} else {
				// parse through possible MIME type, only interested in the last part
				const re = /[^\s\/]+\/(?:[^\s\/]+\+|x-|vnd.)?([\w\-]+)/;
				const mime = re.exec(languageName);
				languageName = mime ? mime[1] : null;
			}
			langHLJS = LANGUAGE_MAP.get(languageName);
		}

		if(!langHLJS) {
			domNode.children[0].className = "language-unknown";
			return;
		}

		if($tw.browser && !domNode.isTiddlyWikiFakeDom) {
			domNode.children[0].className = "language-" + langHLJS;
			hljs.highlightElement(domNode.children[0]);
		} else {
			const result = hljs.highlight(code,{ language: langHLJS, ignoreIllegals: false });
			updateInnerHTML(domNode.children[0],code,result.value,result.language);
		}
	};
}
