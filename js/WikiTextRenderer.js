/*\
title: js/WikiTextRenderer.js

An array of JavaScript functions that generate a specified representation of a parse tree

\*/
(function(){

/*jslint node: true */
"use strict";

var HTML = require("./HTML.js").HTML,
	utils = require("./Utils.js");

var WikiTextRenderer = function() {
	this.renderSteps = []; // Array of {step: n, dependencies: {},handler: function(tiddler,renderer,store,utils) {}}
};

WikiTextRenderer.prototype.addRenderStep = function(renderStep) {
	this.renderSteps.push(renderStep);
	return this.renderSteps.length - 1;
};

WikiTextRenderer.prototype.render = function(tiddler,store,renderStep) {
	renderStep = renderStep || 0;
	var step = this.renderSteps[renderStep];
	if(renderStep < this.renderSteps.length) {
		switch(step.type) {
			case "main":
				return step.handler(tiddler,this,store,utils);
			case "macro":
				return store.renderMacro(step.macro,
										step.renderType,
										tiddler,
										step.params(tiddler,this,store,utils),
										step.content(tiddler,this,store,utils));
		}
	} else {
		return null;
	}
};

WikiTextRenderer.prototype.rerender = function(node,changes,tiddler,store,renderStep) {
	renderStep = renderStep || 0;
	var step = this.renderSteps[renderStep];
	if(renderStep < this.renderSteps.length) {
		switch(step.type) {
			case "main":
				node.innerHTML = step.handler(tiddler,this,store,utils);
				break;
			case "macro":
				store.rerenderMacro(node,changes,step.macro,
								step.renderType,
								tiddler,
								step.params(tiddler,this,store,utils),
								step.content(tiddler,this,store,utils));
				break;
		}
	}
};

WikiTextRenderer.prototype.toString = function(type) {
	var renderNode,
		renderArray = function(tree) {
			var children = [];
			for(var t=0; t<tree.length; t++) {
				children.push(HTML.elem("li",{
					"class": ["nodeWikiTextRenderer"]
				},renderNode(tree[t])));
			}
			return HTML.elem("ul",{
				"class": ["treeWikiTextRenderer"]
			},children);
		};
	renderNode = function(node) {
		var ret = [];
		ret.push(HTML.splitLabel(
			"rendererStep",
			[HTML.text(node.step.toString())],
			[HTML.text(node.type.toString())]
		));
		if(node.macro) {
			ret.push(HTML.splitLabel(
				"macro",
				[HTML.text("macro")],
				[HTML.text(node.macro)]
			));
		}
		if(node.params) {
			ret.push(HTML.splitLabel(
				"params",
				[HTML.text("params")],
				[HTML.raw(utils.htmlEncode(node.params.toString()).replace(/\n/g,"<br>"))]
			));
		}
		if(node.dependencies) {
			var dependencies = [];
			for(var d in node.dependencies) {
				if(d === "dependentAll") {
					dependencies.push(HTML.splitLabel("dependency",[HTML.text(d)],[HTML.text(node.dependencies[d])]));
				} else {
					var dependents = [];
					for(var t in node.dependencies[d]) {
						dependents.push(t);
					}
					dependencies.push(HTML.splitLabel("dependency",[HTML.text(d)],[HTML.text(dependents.join(","))]));
				}
			}
			ret.push(HTML.splitLabel(
				"dependencies",
				[HTML.text("Dependencies")],
				dependencies
			));
		}
		if(node.content) {
			ret.push(HTML.splitLabel(
				"content",
				[HTML.text("content")],
				[HTML.raw(utils.htmlEncode(node.content.toString()).replace(/\n/g,"<br>"))]
			));
		}
		if(node.handler) {
			ret.push(HTML.splitLabel(
				"handler",
				[HTML.text("handler")],
				[HTML.raw(utils.htmlEncode(node.handler.toString()).replace(/\n/g,"<br>"))]
			));
		}
		return ret;
	};
	return HTML(renderArray(this.renderSteps),type);
};

exports.WikiTextRenderer = WikiTextRenderer;

})();
