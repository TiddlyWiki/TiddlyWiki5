/*\
title: $:/core/modules/widgets/classictransclude.js
type: application/javascript
module-type: widget

Transclude widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";
var sliceSeparator = "::";
var sectionSeparator = "##";

function getsectionname(title) {
	if(!title)
		return "";
	var pos = title.indexOf(sectionSeparator);
	if(pos != -1) {
		return title.substr(pos + sectionSeparator.length);
	}
	return "";
}
function getslicename(title) { 
	if(!title)
		return "";
	var pos = title.indexOf(sliceSeparator);
	if(pos != -1) {
		return title.substr(pos + sliceSeparator.length);
	}
	return "";
};
function gettiddlername(title) {
	if(!title)
		return "";
	var pos = title.indexOf(sectionSeparator);

	if(pos != -1) {
		return title.substr(0,pos);
	}
	pos = title.indexOf(sliceSeparator);
	if(pos != -1) {
		return title.substr(0,pos);
	}
	return title;
}
var Widget = require("$:/core/modules/widgets/widget.js").widget;

var TranscludeWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
TranscludeWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
TranscludeWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
TranscludeWidget.prototype.execute = function() {
	// Get our parameters
	this.rawTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	this.transcludeTitle = gettiddlername(this.rawTitle);
	this.section = getsectionname(this.rawTitle);
	this.slice = getslicename(this.rawTitle);
	// Check for recursion
	var recursionMarker = this.makeRecursionMarker();
	if(this.parentWidget && this.parentWidget.hasVariable("transclusion",recursionMarker)) {
		this.makeChildWidgets([{type: "text", text: $tw.language.getString("Error/RecursiveTransclusion")}]);
		return;
	}
	// Check for correct type
	var existingTiddler = this.wiki.getTiddler(this.transcludeTitle);
	// Check if we're dealing with a classic tiddler
	if(existingTiddler && existingTiddler.hasField("type") && existingTiddler.fields.type !== "text/x-tiddlywiki") {
		this.makeChildWidgets([{type: "text", text: "Tiddler not of type 'text/x-tiddlywiki'"}]);
		return;
	}
	if(existingTiddler && !existingTiddler.hasField("type")) {
		this.makeChildWidgets([{type: "text", text: "Tiddler not of type 'text/x-tiddlywiki'"}]);
		return;
	}		
	// Set context variables for recursion detection
	this.setVariable("transclusion",recursionMarker);
	// Parse 
	var text = this.wiki.getTiddlerText(this.transcludeTitle);
	if (!!this.section||!!this.slice) {
		text =this.refineTiddlerText(text, this.section, this.slice);
	}

	this.options  ={};
	this.options.parseAsInline = false;
	var parser = this.wiki.parseText("text/x-tiddlywiki",text,{});
	var	parseTreeNodes = parser ? parser.tree : this.parseTreeNode.children;
	// Construct the child widgets
	this.makeChildWidgets(parseTreeNodes);
};
/*
Compose a string comprising the title, field and/or index to identify this transclusion for recursion detection
*/
TranscludeWidget.prototype.makeRecursionMarker = function() {
	var output = [];
	output.push("{");
	output.push(this.getVariable("currentTiddler",{defaultValue: ""}));
	output.push("|");
	output.push(this.transcludeTitle || "");
	output.push("|");
	output.push(this.transcludeField || "");
	output.push("|");
	output.push(this.transcludeIndex || "");
	output.push("|");
	output.push(this.section || "");
	output.push("|");
	output.push(this.slice || "");
	output.push("}");
	return output.join("");
};

TranscludeWidget.prototype.slicesRE = /(?:^([\'\/]{0,2})~?([\.\w]+)\:\1[\t\x20]*([^\n]*)[\t\x20]*$)|(?:^\|([\'\/]{0,2})~?([\.\w]+)\:?\4\|[\t\x20]*([^\|\n]*)[\t\x20]*\|$)/gm;

TranscludeWidget.prototype.calcAllSlices = function(text)
{
	var slices = {};
	this.slicesRE.lastIndex = 0;
	var m = this.slicesRE.exec(text);
	while(m) {
		if(m[2])
			slices[m[2]] = m[3];
		else
			slices[m[5]] = m[6];
		m = this.slicesRE.exec(text);
	}
	return slices;
};

// Returns the slice of text of the given name
TranscludeWidget.prototype.getTextSlice = function(text,sliceName)
{
	return (this.calcAllSlices(text))[sliceName];
};

TranscludeWidget.prototype.refineTiddlerText = function(text,section,slice)
{
	var textsection = null;
	if (slice) {
		var textslice = this.getTextSlice(text,slice);
		if(textslice)
			return textslice;
	}
	if(!section)
		return text;
	var re = new RegExp("(^!{1,6}[ \t]*" + $tw.utils.escapeRegExp(section) + "[ \t]*\n)","mg");
	re.lastIndex = 0;
	var match = re.exec(text);
	if(match) {
		var t = text.substr(match.index+match[1].length);
		var re2 = /^!/mg;
		re2.lastIndex = 0;
		match = re2.exec(t); //# search for the next heading
		if(match)
			t = t.substr(0,match.index-1);//# don't include final \n
		return t;
	}
	return "";
}

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
TranscludeWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.tiddler ||changedTiddlers[this.transcludeTitle]) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);		
	}
};

exports.classictransclude = TranscludeWidget;

})();
