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
<_transclude target="Foo"/>
}}}

This will render the tiddler Foo within the current tiddler. If the tiddler Foo includes
the view widget (or other widget that reference the fields of the current tiddler), then the
fields of the tiddler Foo will be accessed.

If you want to transclude the tiddler as a template, so that the fields referenced by the view
widget are those of the tiddler doing the transcluding, then you can instead specify the tiddler
as a template:

{{{
<_transclude template="Foo"/>
}}}

The effect is the same as the previous example: the text of the tiddler Foo is rendered. The
difference is that the view widget will access the fields of the tiddler doing the transcluding.

The `target` and `template` attributes may be combined:

{{{
<_transclude template="Bar" target="Foo"/>
}}}

Here, the text of the tiddler `Bar` will be transcluded, with the widgets within it accessing the fields
of the tiddler `Foo`.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "transclude";

exports.init = function(renderer) {
	// Save state
	this.renderer = renderer;
	// Generate child nodes
	this.generateChildNodes();
};

exports.generateChildNodes = function() {
	var tr, templateParseTree, templateTiddler;
	// We'll manage our own dependencies
	this.renderer.dependencies = undefined;
	// Get the render target details
	this.targetTitle = this.renderer.getAttribute("target",this.renderer.getContextTiddlerTitle());
	// Get the render tree for the template
	this.templateTitle = undefined;
	if(this.renderer.parseTreeNode.children && this.renderer.parseTreeNode.children.length > 0) {
		// Use the child nodes as the template if we've got them
		templateParseTree = this.renderer.parseTreeNode.children;
	} else {
		this.templateTitle = this.renderer.getAttribute("template",this.targetTitle);
		// Check for recursion
		if(this.renderer.checkContextRecursion({
			tiddlerTitle: this.targetTitle,
			templateTitle: this.templateTitle
		})) {
			templateParseTree = [{type: "text", text: "Tiddler recursion error in transclude widget"}];	
		} else {
			var parser = this.renderer.renderTree.wiki.new_parseTiddler(this.templateTitle);
			templateParseTree = parser ? parser.tree : [];
		}
	}
	// Set up the attributes for the wrapper element
	var classes = [];
	if(!this.renderer.renderTree.wiki.tiddlerExists(this.targetTitle)) {
		$tw.utils.pushTop(classes,"tw-tiddler-missing");
	}
	// Create the renderers for the wrapper and the children
	var newRenderContext = {
		tiddlerTitle: this.targetTitle,
		templateTitle: this.templateTitle,
		parentContext: this.renderer.renderContext
	};
	this.children = this.renderer.renderTree.createRenderers(newRenderContext,[{
		type: "element",
		tag: this.renderer.parseTreeNode.isBlock ? "div" : "span",
		attributes: {
			"class": {type: "string", value: classes.join(" ")}
		},
		children: templateParseTree
	}]);
};

exports.render = function(type) {
	var output = [];
	$tw.utils.each(this.children,function(node) {
		if(node.render) {
			output.push(node.render(type));
		}
	});
	return output.join("");
};

exports.renderInDom = function(parentElement) {
	this.parentElement = parentElement;
	// Render any child nodes
	$tw.utils.each(this.children,function(node) {
		if(node.renderInDom) {
			parentElement.appendChild(node.renderInDom());
		}
	});
};

exports.refreshInDom = function(changedAttributes,changedTiddlers) {
	// Set the class for missing tiddlers
	if(this.targetTitle) {
		$tw.utils.toggleClass(this.children[0].domNode,"tw-tiddler-missing",!this.renderer.renderTree.wiki.tiddlerExists(this.targetTitle));
	}
	// Check if any of our attributes have changed, or if a tiddler we're interested in has changed
	if(changedAttributes.target || changedAttributes.template || (this.targetTitle && changedTiddlers[this.targetTitle]) || (this.templateTitle && changedTiddlers[this.templateTitle])) {
		// Remove old child nodes
		$tw.utils.removeChildren(this.parentElement);
		// Regenerate and render children
		this.generateChildNodes();
		var self = this;
		$tw.utils.each(this.children,function(node) {
			if(node.renderInDom) {
				self.parentElement.appendChild(node.renderInDom());
			}
		});
	} else {
		// We don't need to refresh ourselves, so just refresh any child nodes
		$tw.utils.each(this.children,function(node) {
			if(node.refreshInDom) {
				node.refreshInDom(changedTiddlers);
			}
		});
	}
};

})();
