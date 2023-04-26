/*\
title: $:/core/modules/widgets/testcase.js
type: application/javascript
module-type: widget

Widget to display a test case

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var TestCaseWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
TestCaseWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
TestCaseWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	// Render the children into a hidden DOM node
	var parser = {
		tree: [{
			type: "widget",
			attributes: {},
			orderedAttributes: [],
			children: this.parseTreeNode.children || []
		}]
	};
	this.contentRoot = this.wiki.makeWidget(parser,{
		document: $tw.fakeDocument,
		parentWidget: this
	});
	this.contentContainer = $tw.fakeDocument.createElement("div");
	this.contentRoot.render(this.contentContainer,null);
	// Create a wiki
	this.testcaseWiki = new $tw.Wiki();
	// Always load the core plugin
	this.testcaseWiki.addTiddler(this.wiki.getTiddler("$:/core"));
	// Load tiddlers from child data widgets
	var tiddlers = [];
	this.findChildrenDataWidgets(this.contentRoot.children,"data",function(widget) {
		Array.prototype.push.apply(tiddlers,widget.readDataTiddlerValues());
	});
	this.testcaseWiki.addTiddlers(tiddlers);
	// Unpack plugin tiddlers
	this.testcaseWiki.readPluginInfo();
	this.testcaseWiki.registerPluginTiddlers("plugin");
	this.testcaseWiki.unpackPluginTiddlers();
	this.testcaseWiki.addIndexersToWiki();
	// Generate a `transclusion` variable that depends on the values of the payload tiddlers so that the template can easily make unique state tiddlers
	this.setVariable("transclusion",$tw.utils.hashString(this.testcaseWiki.getTiddlersAsJson("[all[tiddlers]]")));
	// Generate a `testcaseInfo` variable that contains information about the subwiki in JSON format
	var testcaseInfoData = {
		tiddlers: {} // Hashmap of tiddler titles mapped to array of field names
	};
	this.testcaseWiki.each(function(tiddler,title) {
		testcaseInfoData.tiddlers[title] = Object.keys(tiddler.fields);
	});
	this.setVariable("testcaseInfo",JSON.stringify(testcaseInfoData));
	// Render the page root template of the subwiki
	var rootWidget = this.testcaseWiki.makeTranscludeWidget(this.testcaseTemplate,{document: this.document, parseAsInline: false, parentWidget: this});
	rootWidget.render(parent,nextSibling);
	// Trap changes in the wiki and refresh the rendering
	this.testcaseWiki.addEventListener("change",function(changes) {
		rootWidget.refresh(changes,parent,nextSibling);
	});
};

/*
Compute the internal state of the widget
*/
TestCaseWidget.prototype.execute = function() {
	this.testcaseTemplate = this.getAttribute("template","$:/core/ui/testcases/DefaultTemplate");
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
TestCaseWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if($tw.utils.count(changedAttributes) > 0) {
		this.refreshSelf();
		return true;
	} else {
		return false;
	}
};

exports["testcase"] = TestCaseWidget;

})();
