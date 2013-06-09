/*\
title: $:/core/modules/widgets/transclude.js
type: application/javascript
module-type: widget

The transclude widget includes another tiddler into the tiddler being rendered.

Attributes:
	target: the title of the tiddler to transclude
	template: the title of the tiddler to use as a template for the transcluded tiddler

The simplest case is to just supply a target tiddler:

{{{
<$transclude target="Foo"/>
}}}

This will render the tiddler Foo within the current tiddler. If the tiddler Foo includes
the view widget (or other widget that reference the fields of the current tiddler), then the
fields of the tiddler Foo will be accessed.

If you want to transclude the tiddler as a template, so that the fields referenced by the view
widget are those of the tiddler doing the transcluding, then you can instead specify the tiddler
as a template:

{{{
<$transclude template="Foo"/>
}}}

The effect is the same as the previous example: the text of the tiddler Foo is rendered. The
difference is that the view widget will access the fields of the tiddler doing the transcluding.

The `target` and `template` attributes may be combined:

{{{
<$transclude template="Bar" target="Foo"/>
}}}

Here, the text of the tiddler `Bar` will be transcluded, with the widgets within it accessing the fields
of the tiddler `Foo`.

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
		tr, templateParseTree, templateTiddler;
	// Get the render target details
	this.targetTitle = this.renderer.getAttribute("target",this.renderer.tiddlerTitle);
	this.targetField = this.renderer.getAttribute("field");
	this.targetIndex = this.renderer.getAttribute("index");
	this.currentField = this.renderer.getAttribute("currentField");
	// Get the render tree for the template
	this.templateTitle = undefined;
	if(this.renderer.parseTreeNode.children && this.renderer.parseTreeNode.children.length > 0) {
		// Use the child nodes as the template if we've got them
		templateParseTree = this.renderer.parseTreeNode.children;
	} else {
		this.templateTitle = this.renderer.getAttribute("template",this.targetTitle);
		// Check for recursion
		if(this.renderer.renderTree.checkContextRecursion(this.renderer.parentRenderer,{
				tiddlerTitle: this.targetTitle,
				templateTitle: this.templateTitle
			})) {
			templateParseTree = [{type: "text", text: "Tiddler recursion error in transclude widget"}];	
		} else {
			var parser;
			if(this.targetField === "text" || (!this.targetField && !this.targetIndex)) {
				parser = this.renderer.renderTree.wiki.parseTiddler(this.templateTitle,{parseAsInline: !this.renderer.parseTreeNode.isBlock});
			} else {
				var tiddler,text;
				if(this.targetField) {
					tiddler = this.renderer.renderTree.wiki.getTiddler(this.targetTitle);
					text = tiddler ? tiddler.fields[this.targetField] : "";
					if(text === undefined) {
						text = "";
					}
					parser = this.renderer.renderTree.wiki.parseText("text/vnd.tiddlywiki",text,{parseAsInline: !this.renderer.parseTreeNode.isBlock});
				} else if(this.targetIndex) {
					text = this.renderer.renderTree.wiki.extractTiddlerDataItem(this.targetTitle,this.targetIndex,"");
					parser = this.renderer.renderTree.wiki.parseText("text/vnd.tiddlywiki",text);
				}
			}
			templateParseTree = parser ? parser.tree : [];
		}
	}
	// Set up the attributes for the wrapper element
	var classes = ["tw-transclude"];
	if(this.renderer.hasAttribute("class")) {
		$tw.utils.pushTop(classes,this.renderer.getAttribute("class").split(" "));
	}
	if(!this.renderer.renderTree.wiki.tiddlerExists(this.targetTitle) && !this.renderer.renderTree.wiki.isShadowTiddler(this.targetTitle)) {
		$tw.utils.pushTop(classes,"tw-tiddler-missing");
	}
	// Save the context for this renderer node
	this.renderer.context = {
		tiddlerTitle: this.targetTitle,
		templateTitle: this.templateTitle
	};
	// Initialise events
	this.events = [];
	// If a current field is specified
	if(this.currentField) {
		// Record the current field in the render context
		this.renderer.context.field = this.currentField;
		// Add an event handler to record the current field
		this.events.push({name: "tw-remove-field", handlerFunction: function(event) {
			event.currentField = self.currentField;
			return true;
		}});
	}
	// Trap and update tag modification events
	this.events.push({name: "tw-remove-tag", handlerFunction: function(event) {
		event.currentTag = self.targetTitle;
		return true;
	}});
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
	// Set the class for missing tiddlers
	if(this.targetTitle && changedTiddlers[this.targetTitle]) {
		$tw.utils.toggleClass(this.renderer.domNode,"tw-tiddler-missing",!this.renderer.renderTree.wiki.tiddlerExists(this.targetTitle));
	}
	// Check if any of our attributes have changed, or if a tiddler we're interested in has changed
	if(changedAttributes.target || changedAttributes.template || (this.templateTitle && changedTiddlers[this.templateTitle])) {
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
