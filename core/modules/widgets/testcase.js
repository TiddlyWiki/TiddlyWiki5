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
	// Load tiddlers from child data widgets
	var tiddlers = this.readTiddlerDataWidgets(this.contentRoot.children);
	this.testcaseWiki.addTiddlers(tiddlers);
	// Load tiddlers from the optional testcaseTiddler
	if(this.testcaseTiddler) {
		var tiddler = this.wiki.getTiddler(this.testcaseTiddler);
		if(tiddler && tiddler.fields.type === "text/vnd.tiddlywiki-multiple") {
			var tiddlers = this.extractMultipleTiddlers(tiddler.fields.text);
			this.testcaseWiki.addTiddlers(tiddlers);
		}
	}
	// Unpack plugin tiddlers
	this.testcaseWiki.readPluginInfo();
	this.testcaseWiki.registerPluginTiddlers("plugin");
	this.testcaseWiki.unpackPluginTiddlers();
	this.testcaseWiki.addIndexersToWiki();
	// Gemerate a `transclusion` variable that depends on the values of the payload tiddlers so that the template can easily make unique state tiddlers
	this.setVariable("transclusion",$tw.utils.hashString(this.testcaseWiki.getTiddlersAsJson("[all[tiddlers]]")));
	// Generate a `testcaseInfo` variable that contains information about the subwiki in JSON format
	var testcaseInfoData = {
		titles: this.testcaseWiki.allTitles()
	};
	this.setVariable("testcaseInfo",JSON.stringify(testcaseInfoData));
	// Render children from the template
	this.renderChildren(parent,nextSibling);
};

TestCaseWidget.prototype.extractMultipleTiddlers = function(text) {
	// Duplicates code found in $:/plugins/tiddlywiki/jasmine/run-wiki-based-tests.js
	var rawTiddlers = text.split("\n+\n"),
		tiddlers = [];
	$tw.utils.each(rawTiddlers,function(rawTiddler) {
		var fields = Object.create(null),
			split = rawTiddler.split(/\r?\n\r?\n/mg);
		if(split.length >= 1) {
			fields = $tw.utils.parseFields(split[0],fields);
		}
		if(split.length >= 2) {
			fields.text = split.slice(1).join("\n\n");
		}
		tiddlers.push(fields);
	});
	return tiddlers;
};

/*
Render a test case
*/
TestCaseWidget.prototype.testcaseRenderTiddler = function(parent,nextSibling,title,mode) {
	var self = this;
	// Parse and render a tiddler
	var rootWidget = this.testcaseWiki.makeTranscludeWidget(title,{document: this.document, parseAsInline: mode === "inline", parentWidget: this});
	rootWidget.render(parent,nextSibling);
};

/*
View a test case tiddler in plain text
*/
TestCaseWidget.prototype.testcaseRawTiddler = function(parent,nextSibling,title) {
	var self = this;
	// Render a text widget with the text of a tiddler
	var text = this.testcaseWiki.getTiddlerText(title);
	parent.insertBefore(this.document.createTextNode(text),nextSibling);
};

/*
Find child data widgets
*/
TestCaseWidget.prototype.findDataWidgets = function(children,tag,callback) {
	var self = this;
	$tw.utils.each(children,function(child) {
		if(child.dataWidgetTag === tag) {
			callback(child);
		}
		if(child.children) {
			self.findDataWidgets(child.children,tag,callback);
		}
	});
};

/*
Find the child data widgets
*/
TestCaseWidget.prototype.readTiddlerDataWidgets = function(children) {
	var self = this,
		results = [];
	this.findDataWidgets(children,"data",function(widget) {
		Array.prototype.push.apply(results,self.readTiddlerDataWidget(widget));
	});
	return results;
};

/*
Read the value(s) from a data widget
*/
TestCaseWidget.prototype.readTiddlerDataWidget = function(dataWidget) {
	var self = this;
	// Start with a blank object
	var item = Object.create(null);
	// Read any attributes not prefixed with $
	$tw.utils.each(dataWidget.attributes,function(value,name) {
		if(name.charAt(0) !== "$") {
			item[name] = value;			
		}
	});
	// Deal with $tiddler or $filter attributes
	var titles;
	if(dataWidget.hasAttribute("$tiddler")) {
		titles = [dataWidget.getAttribute("$tiddler")];
	} else if(dataWidget.hasAttribute("$filter")) {
		titles = this.wiki.filterTiddlers(dataWidget.getAttribute("$filter"));
	}
	if(titles) {
		var self = this;
		var results = [];
		$tw.utils.each(titles,function(title,index) {
			var tiddler = self.wiki.getTiddler(title),
				fields;
			if(tiddler) {
				fields = tiddler.getFieldStrings();
			}
			results.push($tw.utils.extend({},fields,item));
		})
		return results;
	} else {
		return [item];
	}
};

/*
Compute the internal state of the widget
*/
TestCaseWidget.prototype.execute = function() {
	this.testcaseTiddler = this.getAttribute("testcase-tiddler");
	this.testcaseTemplate = this.getAttribute("template","$:/core/ui/testcases/DefaultTemplate");
	// Make child widgets
	var parseTreeNodes = [{
		type: "transclude",
		attributes: {
			tiddler: {
				name: "tiddler",
				type: "string",
				value: this.testcaseTemplate
			}
		},
		isBlock: true}];
	this.makeChildWidgets(parseTreeNodes);
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
		return this.refreshChildren(changedTiddlers);
	}
};

exports["testcase"] = TestCaseWidget;

})();
