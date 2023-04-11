/*\
title: $:/core/modules/widgets/testcase-view.js
type: application/javascript
module-type: widget

Widget to render a plain text view of a tiddler from a test case

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget,
	TestCaseWidget = require("$:/core/modules/widgets/testcase.js").testcase;

var TestCaseViewWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
TestCaseViewWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
TestCaseViewWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	// Find the parent testcase
	var pointer = this.parentWidget;
	while(pointer && !(pointer instanceof TestCaseWidget)) {
		pointer = pointer.parentWidget;
	}
	// Render the transclusion
	if(pointer && pointer.testcaseRawTiddler) {
		pointer.testcaseRawTiddler(parent,nextSibling,this.testcaseViewTiddler,this.testcaseViewField)
	}
};

/*
Compute the internal state of the widget
*/
TestCaseViewWidget.prototype.execute = function() {
	this.testcaseViewTiddler = this.getAttribute("tiddler");
	this.testcaseViewField = this.getAttribute("field","text");
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
TestCaseViewWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if($tw.utils.count(changedAttributes) > 0) {
		this.refreshSelf();
		return true;
	} else {
		return false;
	}
};

exports["testcase-view"] = TestCaseViewWidget;

})();
