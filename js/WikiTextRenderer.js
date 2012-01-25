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
	if(renderStep < this.renderSteps.length) {
		return this.renderSteps[renderStep].handler(tiddler,this,store,utils);
	} else {
		return null;
	}
};

WikiTextRenderer.prototype.toString = function(type) {
	var output = [],
		customTemplates = [
			function(output,type,node) { // Rendering step
				if(node.step !== undefined) {
					output.push(utils.stitchElement("span",
						{"data-tw-treenode-type": "renderStep"},{
						content: node.step.toString(),
						classNames: ["treeNode","label"]
					}));
					output.push(utils.stitchElement("span",null,
						{classNames: ["treeNode","splitLabel"]}));
					output.push(utils.stitchElement("span",{"data-tw-treenode-type": "renderStepDependencies"},{
						content: "dependencies",
						classNames: ["splitLabelLeft"]
					}));
					output.push(utils.stitchElement("span",null,{
						content: utils.htmlEncode(node.dependencies === null ? "*" : node.dependencies.join(", ")),
						classNames: ["splitLabelRight"]
					}));
					output.push("</span>");
					output.push(utils.stitchElement("span",null,
						{classNames: ["treeNode","splitLabel"]}));
					output.push(utils.stitchElement("span",{"data-tw-treenode-type": "renderStepHandler"},{
						content: "handler",
						classNames: ["splitLabelLeft"]
					}));
					output.push(utils.stitchElement("code",null,{
						content: utils.htmlEncode(node.handler.toString()).replace(/\n/g,"<br>"),
						classNames: ["splitLabelRight"]
					}));
					output.push("</span>");
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
