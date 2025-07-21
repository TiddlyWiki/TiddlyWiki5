/*\
title: $:/plugins/tiddlywiki/katex/wrapper.js
type: application/javascript
module-type: widget

Wrapper for `katex.min.js` that provides a `<$latex>` widget. It is also available under the alias `<$katex>`

\*/

"use strict";

const katex = require("$:/plugins/tiddlywiki/katex/katex.min.js");
const chemParse = require("$:/plugins/tiddlywiki/katex/mhchem.min.js");
const Widget = require("$:/core/modules/widgets/widget.js").widget;

katex.macros = {};
katex.updateMacros = function() {
	const tiddlers = $tw.wiki.getTiddlersWithTag("$:/tags/KaTeX/Macro");
	const regex = /#\d/g; // Remove the arguments like #1#2
	let tid; let macro; let cmd;
	for(let i = 0;i < tiddlers.length;i++) {
		tid = $tw.wiki.getTiddler(tiddlers[i]);
		try {
			macro = tid.fields["caption"];
			macro = macro.replace(regex,"");
			cmd = tid.fields["text"];
			katex.macros[macro] = cmd;
		} catch(ex) {// Catch the bad ones
		};
	};
};

const KaTeXWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
KaTeXWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
KaTeXWidget.prototype.render = function(parent,nextSibling) {
	// Housekeeping
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	// Get the source text
	const text = this.getAttribute("text",this.parseTreeNode.text || "");
	const displayMode = this.getAttribute("displayMode",this.parseTreeNode.displayMode || "false") === "true";
	katex.updateMacros();
	// Render it into a span
	const span = this.document.createElement("span");
	const options = {throwOnError: false,displayMode,macros: katex.macros};
	try {
		if(!this.document.isTiddlyWikiFakeDom) {
			katex.render(text,span,options);
		} else {
			span.innerHTML = katex.renderToString(text,options);
		}
	} catch(ex) {
		span.className = "tc-error";
		span.textContent = ex;
	}
	// Insert it into the DOM
	parent.insertBefore(span,nextSibling);
	this.domNodes.push(span);
};

/*
Compute the internal state of the widget
*/
KaTeXWidget.prototype.execute = function() {
	// Nothing to do for a katex widget
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
KaTeXWidget.prototype.refresh = function(changedTiddlers) {
	const changedAttributes = this.computeAttributes();
	if(changedAttributes.text) {
		this.refreshSelf();
		return true;
	} else {
		return false;
	}
};

exports.latex = KaTeXWidget;
exports.katex = KaTeXWidget;
