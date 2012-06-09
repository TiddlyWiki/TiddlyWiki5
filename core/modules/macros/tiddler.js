/*\
title: $:/core/modules/macros/tiddler.js
type: application/javascript
module-type: macro

The tiddler macros transcludes another macro into the tiddler being rendered.

Parameters:
	target: the title of the tiddler to transclude
	template: the title of the tiddler to use as a template for the transcluded tiddler
	with: optional parameters to be substituted into the rendered tiddler

The simplest case is to just supply a target tiddler:

<<tiddler Foo>> or <<transclude target:Foo>>

This will render the tiddler Foo within the current tiddler. If the tiddler Foo includes
the view macro (or other macros that reference the fields of the current tiddler), then the
fields of the tiddler Foo will be accessed.

If you want to transclude the tiddler as a template, so that the fields referenced by the view
macro are those of the tiddler doing the transcluding, then you can instead specify the tiddler
as a template:

<<tiddler template:Foo>>

The effect is the same as the previous example: the text of the tiddler Foo is rendered. The
difference is that the view macro will access the fields of the tiddler doing the transcluding.

The `target` and `template` parameters may be combined:

<<tiddler target:Foo template:Bar>>

Here, the text of the tiddler `Bar` will be transcluded, with the macros within it accessing the fields
of the tiddler `Foo`.

Finally, the `with` parameter is used to substitute values for the special markers $1, $2, $3 etc. The
substitutions are performed on the tiddler whose text is being rendered: either the tiddler named in
the `template` parameter or, if that parameter is missing, the tiddler named in the `target` parameter.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "tiddler",
	cascadeParams: true, // Cascade names of named parameters to following anonymous parameters
	params: {
		target: {byName: "default", type: "tiddler"},
		template: {byName: true, type: "tiddler"},
		"with": {byName: true, type: "text", dependentAll: true}
	}
};

exports.evaluateDependencies = function() {
	var dependencies = new $tw.Dependencies(),
		template = this.srcParams.template;
	if(template === undefined) {
		template = this.srcParams.target;
	}
	if(typeof template === "function") {
		dependencies.dependentAll = true;
	} else {
		dependencies.addDependency(template,true);
	}
	return dependencies;
};

exports.executeMacro = function() {
	var renderTitle = this.params.target,
		renderTemplate = this.params.template,
		children,
		childrenClone = [],
		t,
		parents = this.parents.slice(0);
	// If there's no render title specified then use the current tiddler title
	if(typeof renderTitle !== "string") {
		renderTitle = this.tiddlerTitle;
	}
	// If there's no template specified then use the target tiddler title
	if(typeof renderTemplate !== "string") {
		renderTemplate = renderTitle;
	}
	// Check for recursion
	if(parents.indexOf(renderTemplate) !== -1) {
		children = [$tw.Tree.errorNode("Tiddler recursion error in <<tiddler>> macro")];	
	} else {
		if(this.hasParameter("with")) {
			// Parameterised transclusion
			var targetTiddler = this.wiki.getTiddler(renderTemplate),
				text = targetTiddler.fields.text;
			var withTokens = [this.params["with"]]; // TODO: Allow for more than one with: parameter
			for(t=0; t<withTokens.length; t++) {
				var placeholderRegExp = new RegExp("\\$"+(t+1),"mg");
				text = text.replace(placeholderRegExp,withTokens[t]);
			}
			children = this.wiki.parseText(targetTiddler.fields.type,text).tree;
		} else {
			// There's no parameterisation, so we can just render the target tiddler directly
			var parseTree = this.wiki.parseTiddler(renderTemplate);
			children = parseTree ? parseTree.tree : [];
		}
	}
	// Update the stack of tiddler titles for recursion detection
	parents.push(renderTemplate);
	// Clone the children
	for(t=0; t<children.length; t++) {
		childrenClone.push(children[t].clone());
	}
	// Execute macros within the children
	for(t=0; t<childrenClone.length; t++) {
		childrenClone[t].execute(parents,renderTitle);
	}
	// Set up the attributes for the wrapper element
	var attributes = {
		"data-tiddler-target": renderTitle,
		"data-tiddler-template": renderTemplate,
		"class": ["tw-tiddler-frame"]
	};
	if(!this.wiki.tiddlerExists(renderTitle)) {
		attributes["class"].push("tw-tiddler-missing");
	}
	// Return the children
	return $tw.Tree.Element("div",attributes,childrenClone);
};

exports.refreshInDom = function(changes) {
	var t;
	// Set the class for missing tiddlers
	var renderTitle = this.params.target;
	if(typeof renderTitle !== "string") {
		renderTitle = this.params.template;
	}
	if(renderTitle) {
		$tw.utils.toggleClass(this.child.domNode,"tw-tiddler-missing",!this.wiki.tiddlerExists(renderTitle));
	}
	// Rerender the tiddler if it is impacted by the changes
	if(this.dependencies.hasChanged(changes,this.tiddlerTitle)) {
		// Manually reexecute and rerender this macro
		var parent = this.child.domNode.parentNode,
			nextSibling = this.child.domNode.nextSibling;
		parent.removeChild(this.child.domNode);
		this.execute(this.parents,this.tiddlerTitle);
		this.child.renderInDom(parent,nextSibling);
	} else {
		this.child.refreshInDom(changes);
	}
};

})();
