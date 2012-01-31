/*\
title: js/WikiTextRenderer.js

An array of JavaScript functions that generate a specified representation of a parse tree

\*/
(function(){

/*jslint node: true */
"use strict";

var utils = require("./Utils.js");

var WikiTextRenderer = function() {
	this.renderSteps = []; // Array of {step: n, dependencies: [],handler: function(tiddler,renderer,store,utils) {}}
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

WikiTextRenderer.prototype.toString = function(type) {
	var output = [],
		stitchSplitLabel = function(name,value) {
			output.push(utils.stitchElement("span",null,
				{classes: ["treeNode","splitLabel"]}));
			output.push(utils.stitchElement("span",null,{
				content: name,
				classes: ["splitLabelLeft"]
			}));
			output.push(utils.stitchElement("code",null,{
				content: value,
				classes: ["splitLabelRight"]
			}));
			output.push("</span>");
		},
		customTemplates = [
			function(output,type,node) { // Rendering step
				if(node.step !== undefined) {
					output.push(utils.stitchElement("span",null,{
						content: node.step.toString(),
						classes: ["treeNode","label"]
					}));
					output.push(utils.stitchElement("span",null,{
						content: node.type.toString(),
						classes: ["treeNode","label"]
					}));
					stitchSplitLabel("dependencies",node.dependencies === null ? "*" : node.dependencies.join(", "));
					if(node.macro) {
						stitchSplitLabel("macro",utils.htmlEncode(node.macro.toString()));
					}
					if(node.params) {
						stitchSplitLabel("params",utils.htmlEncode(node.params.toString()).replace(/\n/g,"<br>"));
					}
					if(node.content) {
						stitchSplitLabel("content",utils.htmlEncode(node.content.toString()).replace(/\n/g,"<br>"));
					}
					if(node.handler) {
						stitchSplitLabel("handler",utils.htmlEncode(node.handler.toString()).replace(/\n/g,"<br>"));
					}
					return true;
				}
				return false;
			}
		];
	utils.renderObject(output,type,this.renderSteps,customTemplates);
	return output.join("");
};

exports.WikiTextRenderer = WikiTextRenderer;

})();
