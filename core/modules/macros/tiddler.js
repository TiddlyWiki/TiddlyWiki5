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
		templateText: {byName: true, type: "text"},
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
	var renderTitle, renderTemplateTitle, renderTemplateTree,
		children, parseTree,
		t,
		parents = this.parents.slice(0),
		parseOptions = {};
	// If there's no render title specified then use the current tiddler title
	if(this.hasParameter("target")) {
		renderTitle = this.params.target;
	} else {
		renderTitle = this.tiddlerTitle;
	}
	// Get the render tree for the template
	if(this.hasParameter("templateText")) {
		renderTemplateTree = this.wiki.parseText("text/x-tiddlywiki",this.params.templateText).tree;
	} else {
		if(this.hasParameter("template")) {
			renderTemplateTitle = this.params.template;
		} else {
			renderTemplateTitle = renderTitle;
		}
		// Check for recursion
		if(parents.indexOf(this.params.templateTitle) !== -1) {
			renderTemplateTree = $tw.Tree.errorNode("Tiddler recursion error in <<tiddler>> macro");	
		} else {
			parents.push(renderTemplateTitle);
			renderTemplateTree = [];
			// Check for substitution parameters
			if(this.hasParameter("with")) {
				parseOptions["with"] = [undefined,this.params["with"]]; // TODO: Allow for more than one with: parameter
			}
			parseTree = this.wiki.parseTiddler(renderTemplateTitle,parseOptions);
			children = parseTree ? parseTree.tree : [];
			for(t=0; t<children.length; t++) {
				renderTemplateTree.push(children[t].clone());
			}
		}
	}
	// Execute macros within the children
	for(t=0; t<renderTemplateTree.length; t++) {
		renderTemplateTree[t].execute(parents,renderTitle);
	}
	// Set up the attributes for the wrapper element
	var attributes = {
		"class": []
	};
	if(!this.wiki.tiddlerExists(renderTitle)) {
		attributes["class"].push("tw-tiddler-missing");
	}
	// Return the children
	return $tw.Tree.Element(this.isBlock ? "div" : "span",attributes,renderTemplateTree);
};

exports.refreshInDom = function(changes) {
	var renderTitle;
	// Set the class for missing tiddlers
	if(this.hasParameter("target")) {
		renderTitle = this.params.target;
	} else {
		renderTitle = this.tiddlerTitle;
	}
	if(renderTitle) {
		$tw.utils.toggleClass(this.child.domNode,"tw-tiddler-missing",!this.wiki.tiddlerExists(renderTitle));
	}
	// Rerender the tiddler if it is impacted by the changes
	if(this.dependencies.hasChanged(changes,this.renderTitle)) {
		// Manually reexecute and rerender this macro
		this.reexecuteInDom();
	} else {
		this.child.refreshInDom(changes);
	}
};

})();
