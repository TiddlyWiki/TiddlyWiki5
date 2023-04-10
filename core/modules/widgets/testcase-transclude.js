/*\
title: $:/core/modules/widgets/testcase-transclude.js
type: application/javascript
module-type: widget

Widget to transclude a tiddler from a test case

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget,
	TestCaseWidget = require("$:/core/modules/widgets/testcase.js").testcase;

var TestCaseTranscludeWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
TestCaseTranscludeWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
TestCaseTranscludeWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	// Find the parent testcase
	var pointer = this.parentWidget;
	while(pointer && !(pointer instanceof TestCaseWidget)) {
		pointer = pointer.parentWidget;
	}
	// Render the transclusion
	if(pointer && pointer.testcaseRenderTiddler) {
		pointer.testcaseRenderTiddler(parent,nextSibling,this.testcaseTranscludeTiddler,this.testcaseTranscludeMode)
	}
};

/*
Compute the internal state of the widget
*/
TestCaseTranscludeWidget.prototype.execute = function() {
	this.testcaseTranscludeTiddler = this.getAttribute("tiddler");
	this.testcaseTranscludeMode = this.getAttribute("mode");
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
TestCaseTranscludeWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if($tw.utils.count(changedAttributes) > 0) {
		this.refreshSelf();
		return true;
	} else {
		return false;
	}
};

exports["testcase-transclude"] = TestCaseTranscludeWidget;

})();
