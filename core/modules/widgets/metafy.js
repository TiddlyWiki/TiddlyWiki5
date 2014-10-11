/*\
title: $:/core/modules/widgets/metafy.js
type: application/javascript
module-type: widget

metafy widget

Used to dump javascript tiddlers correctly as .js files as opposed to .js.tid
files.

widget attributes:
* tiddler: defaults to the widget variable currentTiddler.
* detect: regular expression detecting a meta data section (which may be
    empty). Its parameter #2 indicates where to replace/insert meta data
    when such a section is present. Otherwise, the template parameter will
    be used instead. For instance, the following regular expression composed
    of these elements:
      "(^\/\*\\(?:\r?\n))"
        -- the special comment marker at the section beginning on its own line.
      "((?:^[^\r\n]+(?:\r?\n))*)"
        -- matches all meta data field lines.
      "(?:(?:^[^\r\n]*(?:\r?\n))*)"
        -- matches a trailing normal comment text.
      "(?:^\\\*\/(?:\r?\n)?)"
        -- the special comment marker at the section end on its own line.
* exclude: the fields to exclude; defaults to "text bag revision".
* template: template to use to establish meta data section if not yet present.
    $fields$ is used to indicate where to insert the fields (meta) data section of
    "field: value\n" pairs. For instance, "/*\\\n$fields$\\*"+"/\n"

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

/*
Constructor
 */
var MetafyWidget = function(parseTreeNode, options) {
	this.initialise(parseTreeNode, options);
};

/*
Inherit from the base widget class
*/
MetafyWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
MetafyWidget.prototype.render = function(parent, nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	var textNode = this.document.createTextNode(this.text);
	parent.insertBefore(textNode, nextSibling);
	this.domNodes.push(textNode);
};

/*
Compute the internal state of the widget
*/
MetafyWidget.prototype.execute = function() {
	// Get parameters from our attributes
	this.metafyTitle = this.getAttribute("tiddler", this.getVariable("currentTiddler"));
	this.metafyDetect = this.getAttribute("match",
		  "(^\\/\\*\\\\(?:\\r?\\n))" // special comment marker beginning
		+ "((?:^[^\\r\\n]+(?:\\r?\\n))*)" // field name-value pairs
		+ "(?:(?:^[^\\r\\n]*(?:\\r?\\n))*)" // remaining comment section
		+ "(?:^\\\\\\*\\/(?:\\r?\\n)?)" // special comment marker end
	);
	var exclude = this.getAttribute("exclude", "text bag revision");
	exclude = exclude.split(" ");
	this.metafyExclude = exclude;
	this.metafyTemplate = this.getAttribute("template", "/*\\\n$fields$\\*/\n");
	
	var tiddler = this.wiki.getTiddler(this.metafyTitle);
	var text = "";
	if (tiddler) {
		text = this.wiki.getTiddlerText(this.metafyTitle);
	}
	
	var fields = "";
	for(var field in tiddler.fields) {
		if (exclude.indexOf(field) === -1) {
			fields += field + ": " + tiddler.getFieldString(field) + "\n";
		}
	}
	
	var match = new RegExp(this.metafyDetect, "mg").exec(text);
	if (match) {
		var start = match.index + match[1].length;
		text = text.substr(0, start) + fields + text.substr(start + match[2].length);
	} else {
		console.log("no match");
		text = this.metafyTemplate.replace("$fields$", fields) + text;
	}
	
	this.text = text;
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
MetafyWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if(changedAttributes.tiddler || changedAttributes.detect || changedAttributes.exclude || changedAttributes.template || changedTiddlers[this.viewTitle]) {
		this.refreshSelf();
		return true;
	} else {
		return false;
	}
};

/*
Export the metafy widget
 */
exports.metafy = MetafyWidget;

})();
