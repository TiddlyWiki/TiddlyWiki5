/*\
title: $:/core/modules/old_widgets/transclude.js
type: application/javascript
module-type: widget

The transclude widget includes another tiddler into the tiddler being rendered.

Attributes:
	title: the title of the tiddler to transclude

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var TranscludeWidget = function(renderer) {
	// Save state
	this.renderer = renderer;
	// Generate child nodes
	this.generate();
};

TranscludeWidget.prototype.generate = function() {
	var self = this,
		templateParseTree;
	// Get the render target details
	this.transcludeTitle = this.renderer.getAttribute("title",this.renderer.tiddlerTitle);
	this.transcludeField = this.renderer.getAttribute("field");
	this.transcludeIndex = this.renderer.getAttribute("index");
	// Check for recursion
	if(this.renderer.renderTree.checkContextRecursion(this.renderer.parentRenderer,{
			transcludeTitle: this.transcludeTitle,
			transcludeField: this.transcludeField,
			transcludeIndex: this.transcludeIndex
		})) {
		templateParseTree = [{type: "text", text: "Tiddler recursion error in transclude widget"}];	
	} else {
		var parser;
		if(this.transcludeField === "text" || (!this.transcludeField && !this.transcludeIndex)) {
			parser = this.renderer.renderTree.wiki.parseTiddler(this.transcludeTitle,{parseAsInline: !this.renderer.parseTreeNode.isBlock});
		} else {
			var tiddler,text;
			if(this.transcludeField) {
				tiddler = this.renderer.renderTree.wiki.getTiddler(this.transcludeTitle);
				text = tiddler ? tiddler.fields[this.transcludeField] : "";
				if(text === undefined) {
					text = "";
				}
				parser = this.renderer.renderTree.wiki.parseText("text/vnd.tiddlywiki",text,{parseAsInline: !this.renderer.parseTreeNode.isBlock});
			} else if(this.transcludeIndex) {
				text = this.renderer.renderTree.wiki.extractTiddlerDataItem(this.transcludeTitle,this.transcludeIndex,"");
				parser = this.renderer.renderTree.wiki.parseText("text/vnd.tiddlywiki",text,{parseAsInline: !this.renderer.parseTreeNode.isBlock});
			}
		}
		templateParseTree = parser ? parser.tree : [];
	}
	// Set up the attributes for the wrapper element
	var classes = ["tw-transclude"];
	if(this.renderer.hasAttribute("class")) {
		$tw.utils.pushTop(classes,this.renderer.getAttribute("class").split(" "));
	}
	// Save the context for this renderer node
	this.renderer.context = {
		transcludeTitle: this.transcludeTitle,
		transcludeField: this.transcludeField,
		transcludeIndex: this.transcludeIndex
	};
	// Set the element
	this.tag = this.renderer.parseTreeNode.isBlock ? "div" : "span";
	this.attributes = {};
	if(classes.length > 0) {
		this.attributes["class"] = classes.join(" ");
	}
	if(this.renderer.hasAttribute("style")) {
		this.attributes.style = this.renderer.getAttribute("style");
	}
	if(this.renderer.hasAttribute("tooltip")) {
		this.attributes.title = this.renderer.getAttribute("tooltip");
	}
	this.children = this.renderer.renderTree.createRenderers(this.renderer,templateParseTree);
};

TranscludeWidget.prototype.refreshInDom = function(changedAttributes,changedTiddlers) {
	// Check if any of our attributes have changed, or if a tiddler we're interested in has changed
	if(changedAttributes.transcludeField || changedAttributes.transcludeIndex || (this.transcludeTitle && changedTiddlers[this.transcludeTitle])) {
		// Regenerate and rerender the widget and replace the existing DOM node
		this.generate();
		var oldDomNode = this.renderer.domNode,
			newDomNode = this.renderer.renderInDom();
		oldDomNode.parentNode.replaceChild(newDomNode,oldDomNode);
	} else {
		// We don't need to refresh ourselves, so just refresh any child nodes
		$tw.utils.each(this.children,function(node) {
			if(node.refreshInDom) {
				node.refreshInDom(changedTiddlers);
			}
		});
	}
};

exports.transclude = TranscludeWidget;

})();
