/*\

Library function for creating widget using a dom creating function

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

function createDomWidget(domCreatorFunction) {

	var MyWidget = function(parseTreeNode, options) {
		this.initialise(parseTreeNode, options);
	};

	/*
	Inherit from the base widget class
	*/
	MyWidget.prototype = new Widget();

	/*
	Render this widget into the DOM
	*/
	MyWidget.prototype.render = function(parent, nextSibling) {
		this.parentDomNode = parent;
		var domNode = domCreatorFunction(this.document);
		parent.insertBefore(domNode, nextSibling);
		this.domNodes.push(domNode);
	};

	/*
	A widget with optimized performance will selectively refresh, but here we refresh always
	*/
	MyWidget.prototype.refresh = function(changedTiddlers) {
		// Regenerate and rerender the widget and replace the existing DOM node
		this.refreshSelf();
		return true;
	};

	return MyWidget;
}
module.exports = createDomWidget;
})();
