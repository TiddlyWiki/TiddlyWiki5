/*\
title: $:/plugins/tiddlywiki/katex/wrapper.js
type: application/javascript
module-type: widget

Wrapper for `katex.min.js` that provides a `<$latex>` widget. It is also available under the alias `<$katex>`

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var katex = require("$:/plugins/tiddlywiki/katex/katex.min.js"),
    chemParse = require("$:/plugins/tiddlywiki/katex/mhchem.min.js"),
	Widget = require("$:/core/modules/widgets/widget.js").widget;

katex.macros = {
	'\\label': '\\htmlClass{katex-label}{\\htmlId{###1}{}}',
	'\\eqref': '\\htmlClass{katex-eqref}{\\href{#####1}{(\\htmlData{katex-label=#1}{\\text{#1}})}}',
};

katex.updateMacros = function() {
	var tiddlers = $tw.wiki.getTiddlersWithTag("$:/tags/KaTeX/Macro"),
		regex = /#\d/g, // Remove the arguments like #1#2
		tid, macro, cmd;
	for (var i=0; i < tiddlers.length; i++) {
		tid = $tw.wiki.getTiddler(tiddlers[i]);
		try {
			macro = tid.fields["caption"];
			macro = macro.replace(regex, "");
			cmd = tid.fields["text"];
			katex.macros[macro] = cmd;
		} catch(ex) {// Catch the bad ones
		};
	};
};

var KaTeXWidget = function(parseTreeNode,options) {
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
	var text = this.getAttribute("text",this.parseTreeNode.text || "");
	var displayMode = this.getAttribute("displayMode",this.parseTreeNode.displayMode || "false") === "true";
	katex.updateMacros();
	// Render it into a span
	var span = this.document.createElement("span"),
		options = {throwOnError: false, displayMode: displayMode, macros: katex.macros};
	options.trust = function (ctx) {
		return ctx.command == '\\href' || ctx.command == '\\htmlClass' || ctx.command == '\\htmlData' || ctx.command == '\\htmlId' && ctx.id[0] == '#';
	};
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
	// rewrite identifiers to make them unique
	var tiddlerFrame = parent.closest('.tc-tiddler-frame');
	var safeTitle = tiddlerFrame.dataset.tiddlerTitle.replaceAll(/\s+/g, '');
	$tw.utils.each(span.querySelectorAll('.katex-label [id^="#"]'), function (element) {
		var safeId = element.id.replaceAll(/\s+/g, '~');
		element.setAttribute('id', '#' + safeTitle + safeId);
		element.classList.add('katex-label' + safeId);
	});
	$tw.utils.each(span.querySelectorAll('.katex-eqref [href^="##"]'), function (element) {
		element.href = '##' + safeTitle + element.getAttribute('href').substring(1).replaceAll(/\s+/g, '~');
	});
	// Insert it into the DOM
	parent.insertBefore(span,nextSibling);
	this.domNodes.push(span);
	// compute data-katex-eqnum attributes on elements made by \eqref
	$tw.utils.each(span.querySelectorAll('.katex-eqref [data-katex-label]'), function (element) {
		// find a unique matching element made by \label (or quit)
		var katexLabels = tiddlerFrame.getElementsByClassName('katex-label#' + element.dataset.katexLabel.replaceAll(/\s+/g, '~'));
		if (katexLabels.length != 1) return;
		// everything is a <span> and the span holding a row doesn't even have a class
		var katexRow = katexLabels[0].closest('.vlist > *');
		var katexPos = Array.prototype.indexOf.call(katexRow.parentElement.children, katexRow);		// which row has the label
		var katexEqn = katexRow.closest('.katex-html').querySelectorAll('.tag .eqn-num')[katexPos];	// which eqn num corresponds
		if (!tiddlerFrame._katex_eqn_num_elements) {
			tiddlerFrame._katex_eqn_num_elements = tiddlerFrame.getElementsByClassName('eqn-num');
		}
		element.dataset.katexEqnum = 1 + Array.prototype.indexOf.call(tiddlerFrame._katex_eqn_num_elements, katexEqn);
	});
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
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.text) {
		this.refreshSelf();
		return true;
	} else {
		return false;
	}
};

exports.latex = KaTeXWidget;
exports.katex = KaTeXWidget;

})();

