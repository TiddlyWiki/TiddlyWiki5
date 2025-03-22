/*\
title: $:/core/modules/widgets/testcase.js
type: application/javascript
module-type: widget

Widget to display a test case

\*/
(function(){
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
	var self = this;
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	// Create container DOM node
	var domNode = this.document.createElement("div");
	domNode.setAttribute("class", "tc-test-case " + this.testcaseClass);
	this.domNodes.push(domNode);
	parent.insertBefore(domNode,nextSibling);
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
	var loadTiddler = function(title) {
		var tiddler = self.wiki.getTiddler(title);
		if(tiddler) {
			self.testcaseWiki.addTiddler(tiddler);
		}
	}
	loadTiddler("$:/core");
	loadTiddler("$:/plugins/tiddlywiki/codemirror");
	// Load tiddlers from child data widgets
	var tiddlers = [];
	this.findChildrenDataWidgets(this.contentRoot.children,"data",function(widget) {
		Array.prototype.push.apply(tiddlers,widget.readDataTiddlerValues());
	});
	var jsonPayload = JSON.stringify(tiddlers);
	this.testcaseWiki.addTiddlers(tiddlers);
	// Unpack plugin tiddlers
	this.testcaseWiki.readPluginInfo();
	this.testcaseWiki.registerPluginTiddlers("plugin");
	this.testcaseWiki.unpackPluginTiddlers();
	this.testcaseWiki.addIndexersToWiki();
	// Generate a `transclusion` variable that depends on the values of the payload tiddlers so that the template can easily make unique state tiddlers
	this.setVariable("transclusion",$tw.utils.hashString(jsonPayload));
	// Generate a `payloadTiddlers` variable that contains the payload in JSON format
	this.setVariable("payloadTiddlers",jsonPayload);
	// Only run the tests if the testcase output and expected results were specified, and those tiddlers actually exist in the wiki
	var shouldRunTests = false;
	if(this.testcaseTestOutput && this.testcaseWiki.tiddlerExists(this.testcaseTestOutput) && this.testcaseTestExpectedResult && this.testcaseWiki.tiddlerExists(this.testcaseTestExpectedResult)) {
		shouldRunTests = true;
	}
	// Render the test rendering if required
	if(shouldRunTests) {
		var testcaseOutputContainer = $tw.fakeDocument.createElement("div");
		var testcaseOutputWidget = this.testcaseWiki.makeTranscludeWidget(this.testcaseTestOutput,{
			document: $tw.fakeDocument,
			parseAsInline: false,
			parentWidget: this,
			variables: {
				currentTiddler: this.testcaseTestOutput
			}
		});
		testcaseOutputWidget.render(testcaseOutputContainer);
	}
	// Clear changes queue
	this.testcaseWiki.clearTiddlerEventQueue();
	// Run the actions if provided
	if(this.testcaseWiki.tiddlerExists(this.testcaseTestActions)) {
		testcaseOutputWidget.invokeActionString(this.testcaseWiki.getTiddlerText(this.testcaseTestActions));
		testcaseOutputWidget.refresh(this.testcaseWiki.changedTiddlers,testcaseOutputContainer);
	}
	// Set up the test result variables
	var testResult = "",
		outputHTML = "",
		expectedHTML = "";
	if(shouldRunTests) {
		outputHTML = testcaseOutputContainer.children[0].innerHTML;
		expectedHTML = this.testcaseWiki.getTiddlerText(this.testcaseTestExpectedResult);
		if(outputHTML === expectedHTML) {
			testResult = "pass";
		} else {
			testResult = "fail";
		}
		this.setVariable("outputHTML",outputHTML);
		this.setVariable("expectedHTML",expectedHTML);
		this.setVariable("testResult",testResult);
		this.setVariable("currentTiddler",this.testcaseTestOutput);
	}
	// Don't display anything if testHideIfPass is "yes" and the tests have passed
	if(this.testcaseHideIfPass === "yes" && testResult !== "fail") {
		return;
	}
	// Render the page root template of the subwiki
	var rootWidget = this.testcaseWiki.makeTranscludeWidget(this.testcaseTemplate,{
		document: this.document,
		parseAsInline: false,
		parentWidget: this
	});
	rootWidget.render(domNode);
	// Trap changes in the wiki and refresh the rendering
	this.testcaseWiki.addEventListener("change",function(changes) {
		rootWidget.refresh(changes,domNode);
	});
};

/*
Compute the internal state of the widget
*/
TestCaseWidget.prototype.execute = function() {
	this.testcaseTemplate = this.getAttribute("template","$:/core/ui/testcases/DefaultTemplate");
	this.testcaseTestOutput = this.getAttribute("testOutput");
	this.testcaseTestActions = this.getAttribute("testActions");
	this.testcaseTestExpectedResult = this.getAttribute("testExpectedResult");
	this.testcaseHideIfPass = this.getAttribute("testHideIfPass");
	this.testcaseClass = this.getAttribute("class","");
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
		return this.contentRoot.refresh(changedTiddlers);
	}
};

exports["testcase"] = TestCaseWidget;

})();
