/*\
title: $:/core/modules/utils/wikifier.js
type: application/javascript
module-type: utils

A high level helper class for parsing and wikification

\*/
(function(){

/*
Options include:
wiki: wiki to be used for wikification
widget: optional widget to be used as parent of wikified text
text: text to be parsed/wikified
type: type of the text
mode: inline or block
output: text, formattedtext, html, parsetree or widgettree
*/
function Wikifier(options) {
	this.wiki = options.wiki || $tw.wiki;
	this.widget = options.widget || $tw.rootWidget;
	this.text = options.text || "";
	this.type = options.type || "";
	this.mode = options.mode || "block";
	this.output = options.output || "text";
	// Create the parse tree
	this.parser = this.wiki.parseText(this.type,this.text,{
		parseAsInline: this.mode === "inline"
	});
	// Create the widget tree 
	this.widgetNode = this.wiki.makeWidget(this.parser,{
		document: $tw.fakeDocument,
		parentWidget: this.widget
	});
	// Render the widget tree to the container
	this.container = $tw.fakeDocument.createElement("div");
	this.widgetNode.render(this.container,null);
};

Wikifier.prototype.refresh = function(changedTiddlers) {
	// Refresh the widget tree
	return this.widgetNode.refresh(changedTiddlers);
};

/*
Return the result string
*/
Wikifier.prototype.getResult = function() {
	var result;
	switch(this.output) {
		case "text":
			result = this.container.textContent;
			break;
		case "formattedtext":
			result = this.container.formattedTextContent;
			break;
		case "html":
			result = this.container.innerHTML;
			break;
		case "parsetree":
			result = JSON.stringify(this.parser.tree,0,$tw.config.preferences.jsonSpaces);
			break;
		case "widgettree":
			result = JSON.stringify(this.getWidgetTree(),0,$tw.config.preferences.jsonSpaces);
			break;
	}
	return result;
};

/*
Return a string of the widget tree
*/
Wikifier.prototype.getWidgetTree = function() {
	var copyNode = function(widgetNode,resultNode) {
			var type = widgetNode.parseTreeNode.type;
			resultNode.type = type;
			switch(type) {
				case "element":
					resultNode.tag = widgetNode.parseTreeNode.tag;
					break;
				case "text":
					resultNode.text = widgetNode.parseTreeNode.text;
					break;
			}
			if(Object.keys(widgetNode.attributes || {}).length > 0) {
				resultNode.attributes = {};
				$tw.utils.each(widgetNode.attributes,function(attr,attrName) {
					resultNode.attributes[attrName] = widgetNode.getAttribute(attrName);
				});
			}
			if(Object.keys(widgetNode.children || {}).length > 0) {
				resultNode.children = [];
				$tw.utils.each(widgetNode.children,function(widgetChildNode) {
					var node = {};
					resultNode.children.push(node);
					copyNode(widgetChildNode,node);
				});
			}
		},
		results = {};
	copyNode(this.widgetNode,results);
	return results;
};

exports.Wikifier = Wikifier;

})();
