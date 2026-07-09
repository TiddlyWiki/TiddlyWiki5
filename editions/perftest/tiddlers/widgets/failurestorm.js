/*\
title: $:/perf/widgets/failurestorm.js
type: application/javascript
module-type: widget

Widget used by the performance test edition to trigger contained render or refresh failures.

\*/
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var FailureStormWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

FailureStormWidget.prototype = Object.create(Widget.prototype);
FailureStormWidget.prototype.constructor = FailureStormWidget;

FailureStormWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	if(this.getAttribute("throwPhase","") === "render") {
		throw new Error(this.getAttribute("message","failure storm render"));
	}
	var domNode = this.document.createElement("span");
	domNode.className = "tc-perf-failurestorm-ok";
	domNode.appendChild(this.document.createTextNode(this.getAttribute("label","ok")));
	parent.insertBefore(domNode,nextSibling);
	this.domNodes.push(domNode);
};

FailureStormWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes(),
		triggerTitle = this.getAttribute("triggerTitle","");
	if(this.getAttribute("throwPhase","") === "refresh" && triggerTitle && changedTiddlers[triggerTitle]) {
		throw new Error(this.getAttribute("message","failure storm refresh"));
	}
	return $tw.utils.count(changedAttributes) > 0;
};

exports.failurestorm = FailureStormWidget;
