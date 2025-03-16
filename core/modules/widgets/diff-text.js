/*\
title: $:/core/modules/widgets/diff-text.js
type: application/javascript
module-type: widget

Widget to display a diff between two texts

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget,
	dmp = require("$:/core/modules/utils/diff-match-patch/diff_match_patch.js");

var DiffTextWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
DiffTextWidget.prototype = new Widget();

DiffTextWidget.prototype.invisibleCharacters = {
	"\n": "↩︎\n",
	"\r": "⇠",
	"\t": "⇥\t"
};

/*
Render this widget into the DOM
*/
DiffTextWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	// Create the diff
	var dmpObject = new dmp.diff_match_patch(),
		diffs = dmpObject.diff_main(this.getAttribute("source",""),this.getAttribute("dest",""));
	// Apply required cleanup
	switch(this.getAttribute("cleanup","semantic")) {
		case "none":
			// No cleanup
			break;
		case "efficiency":
			dmpObject.diff_cleanupEfficiency(diffs);
			break;
		default: // case "semantic"
			dmpObject.diff_cleanupSemantic(diffs);
			break;
	}
	// Create the elements
	var domContainer = this.document.createElement("div"), 
		domDiff = this.createDiffDom(diffs);
	parent.insertBefore(domContainer,nextSibling);
	// Set variables
	this.setVariable("diff-count",diffs.reduce(function(acc,diff) {
		if(diff[0] !== dmp.DIFF_EQUAL) {
			acc++;
		}
		return acc;
	},0).toString());
	// Render child widgets
	this.renderChildren(domContainer,null);
	// Render the diff
	domContainer.appendChild(domDiff);
	// Save our container
	this.domNodes.push(domContainer);
};

/*
Create DOM elements representing a list of diffs
*/
DiffTextWidget.prototype.createDiffDom = function(diffs) {
	var self = this;
	// Create the element and assign the attributes
	var domPre = this.document.createElement("pre"),
		domCode = this.document.createElement("code");
	$tw.utils.each(diffs,function(diff) {
		var tag = diff[0] === dmp.DIFF_INSERT ? "ins" : (diff[0] === dmp.DIFF_DELETE ? "del" : "span"),
			className = diff[0] === dmp.DIFF_INSERT ? "tc-diff-insert" : (diff[0] === dmp.DIFF_DELETE ? "tc-diff-delete" : "tc-diff-equal"),
			dom = self.document.createElement(tag),
			text = diff[1],
			currPos = 0,
			re = /([\x00-\x1F])/mg,
			match = re.exec(text),
			span,
			printable;
		dom.className = className;
		while(match) {
			if(currPos < match.index) {
				dom.appendChild(self.document.createTextNode(text.slice(currPos,match.index)));
			}
			span = self.document.createElement("span");
			span.className = "tc-diff-invisible";
			printable = self.invisibleCharacters[match[0]] || ("[0x" + match[0].charCodeAt(0).toString(16) + "]");
			span.appendChild(self.document.createTextNode(printable));
			dom.appendChild(span);
			currPos = match.index + match[0].length;
			match = re.exec(text);
		}
		if(currPos < text.length) {
			dom.appendChild(self.document.createTextNode(text.slice(currPos)));
		}
		domCode.appendChild(dom);
	});
	domPre.appendChild(domCode);
	return domPre;
};

/*
Compute the internal state of the widget
*/
DiffTextWidget.prototype.execute = function() {
	// Make child widgets
	var parseTreeNodes;
	if(this.parseTreeNode && this.parseTreeNode.children && this.parseTreeNode.children.length > 0) {
		parseTreeNodes = this.parseTreeNode.children;
	} else {
		parseTreeNodes = [{
			type: "transclude",
			attributes: {
				tiddler: {type: "string", value: "$:/language/Diffs/CountMessage"}
			}
		}];
	}
	this.makeChildWidgets(parseTreeNodes);
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
DiffTextWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.source || changedAttributes.dest || changedAttributes.cleanup) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);
	}
};

exports["diff-text"] = DiffTextWidget;
