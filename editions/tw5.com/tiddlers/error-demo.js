/*\
title: $:/editions/tw5.com/widgets/error-demo.js
type: application/javascript
module-type: widget

A documentation-only widget that deliberately fails, used to demonstrate [[Hidden Setting: Resilient Render]].
It renders normally by default; `<$error-demo fail="render"/>` throws during render and
`<$error-demo fail="refresh"/>` throws on the next refresh. With Resilient Render enabled the throw is
contained as a `tc-error` span; otherwise it propagates (fail-loud).

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ErrorDemoWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

ErrorDemoWidget.prototype = Object.create(Widget.prototype);
ErrorDemoWidget.prototype.constructor = ErrorDemoWidget;

ErrorDemoWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	if(this.getAttribute("fail") === "render") {
		throw new Error("error-demo: deliberate render failure");
	}
	var span = this.document.createElement("span");
	span.appendChild(this.document.createTextNode(this.getAttribute("text","error-demo: OK")));
	parent.insertBefore(span,nextSibling);
	this.domNodes.push(span);
	this.renderChildren(span,null);
};

ErrorDemoWidget.prototype.execute = function() {
	this.makeChildWidgets();
};

ErrorDemoWidget.prototype.refresh = function(changedTiddlers) {
	if(this.getAttribute("fail") === "refresh") {
		throw new Error("error-demo: deliberate refresh failure");
	}
	return this.refreshChildren(changedTiddlers);
};

exports["error-demo"] = ErrorDemoWidget;
