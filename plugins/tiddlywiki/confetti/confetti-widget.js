/*\
title: $:/plugins/tiddlywiki/confetti/confetti-widget.js
type: application/javascript
module-type: widget

Confetti widget

\*/
"use strict";

const Widget = require("$:/core/modules/widgets/widget.js").widget;

const confetti = require("$:/plugins/tiddlywiki/confetti/confetti.js");

const ConfettiWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
ConfettiWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
ConfettiWidget.prototype.render = function(parent,nextSibling) {
	const self = this;
	// Remember parent
	this.parentDomNode = parent;
	// Compute attributes and execute state
	this.computeAttributes();
	this.execute();
	// Launch confetti
	if($tw.browser) {
		const options = {};
		$tw.utils.each(this.attributes,(attribute,name) => {
			options[name] = self.getAttribute(name);
		});
		$tw.confettiManager.launch(options.delay,options);
	}
	// Render children
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
ConfettiWidget.prototype.execute = function() {
	// Make child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
ConfettiWidget.prototype.refresh = function(changedTiddlers) {
	return this.refreshChildren(changedTiddlers);
};

exports.confetti = ConfettiWidget;
