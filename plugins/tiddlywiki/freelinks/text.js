/*\
title: $:/core/modules/widgets/text.js
type: application/javascript
module-type: widget

An override of the core text widget that automatically linkifies the text

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var TITLE_TARGET_FILTER = "$:/config/Freelinks/TargetFilter";

var Widget = require("$:/core/modules/widgets/widget.js").widget,
	LinkWidget = require("$:/core/modules/widgets/link.js").link,
	ButtonWidget = require("$:/core/modules/widgets/button.js").button,
	ElementWidget = require("$:/core/modules/widgets/element.js").element;

var TextNodeWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
TextNodeWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
TextNodeWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
TextNodeWidget.prototype.execute = function() {
	var self = this,
		ignoreCase = self.getVariable("tv-freelinks-ignore-case",{defaultValue:"no"}).trim() === "yes";
	// Get our parameters
	var childParseTree = [{
			type: "plain-text",
			text: this.getAttribute("text",this.parseTreeNode.text || "")
		}];
	// Only process links if not disabled and we're not within a button or link widget
	if(this.getVariable("tv-wikilinks",{defaultValue:"yes"}).trim() !== "no" && this.getVariable("tv-freelinks",{defaultValue:"no"}).trim() === "yes" && !this.isWithinButtonOrLink()) {
		// Get the information about the current tiddler titles, and construct a regexp
		this.tiddlerTitleInfo = this.wiki.getGlobalCache("tiddler-title-info-" + (ignoreCase ? "insensitive" : "sensitive"),function() {
			var targetFilterText = self.wiki.getTiddlerText(TITLE_TARGET_FILTER),
				titles = !!targetFilterText ? self.wiki.filterTiddlers(targetFilterText,$tw.rootWidget) : self.wiki.allTitles(),
				sortedTitles = titles.sort(function(a,b) {
					var lenA = a.length,
						lenB = b.length;
					// First sort by length, so longer titles are first
					if(lenA !== lenB) {
						if(lenA < lenB) {
							return +1;
						} else {
							return -1;
						}
					} else {
					// Then sort alphabetically within titles of the same length
						if(a < b) {
							return -1;
						} else if(a > b) {
							return +1;
						} else {
							return 0;
						}
					}
				}),
				titles = [],
				reparts = [];
			$tw.utils.each(sortedTitles,function(title) {
				if(title.substring(0,3) !== "$:/") {
					titles.push(title);
					reparts.push("(\\b" + $tw.utils.escapeRegExp(title) + "\\b)");
				}
			});
			return {
				titles: titles,
				regexp: new RegExp(reparts.join("|"),ignoreCase ? "i" : "")
			};
		});
		// Repeatedly linkify
		if(this.tiddlerTitleInfo.titles.length > 0) {
			var index,text,match,matchEnd;
			do {
				index = childParseTree.length - 1;
				text = childParseTree[index].text;
				match = this.tiddlerTitleInfo.regexp.exec(text);
				if(match) {
					// Make a text node for any text before the match
					if(match.index > 0) {
						childParseTree[index].text = text.substring(0,match.index);
						index += 1;
					}
					// Make a link node for the match
					childParseTree[index] = {
						type: "link",
						attributes: {
							to: {type: "string", value: ignoreCase ? this.tiddlerTitleInfo.titles[match.indexOf(match[0],1) - 1] : match[0]},
							"class": {type: "string", value: "tc-freelink"}
						},
						children: [{
							type: "plain-text", text: match[0]
						}]
					};
					index += 1;
					// Make a text node for any text after the match
					matchEnd = match.index + match[0].length;
					if(matchEnd < text.length) {
						childParseTree[index] = {
							type: "plain-text",
							text: text.substring(matchEnd)
						};					
					}
				}
			} while(match && childParseTree[childParseTree.length - 1].type === "plain-text");			
		}
	}
	// Make the child widgets
	this.makeChildWidgets(childParseTree);
};

TextNodeWidget.prototype.isWithinButtonOrLink = function() {
	var withinButtonOrLink = false,
		widget = this.parentWidget;
	while(!withinButtonOrLink && widget) {
		withinButtonOrLink = widget instanceof ButtonWidget || widget instanceof LinkWidget || ((widget instanceof ElementWidget) && widget.parseTreeNode.tag === "a");
		widget = widget.parentWidget;
	}
	return withinButtonOrLink;
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
TextNodeWidget.prototype.refresh = function(changedTiddlers) {
	var self = this,
		changedAttributes = this.computeAttributes(),
		titlesHaveChanged = false;
	$tw.utils.each(changedTiddlers,function(change,title) {
		if(change.isDeleted) {
			titlesHaveChanged = true;
		} else {
			titlesHaveChanged = titlesHaveChanged || !self.tiddlerTitleInfo || self.tiddlerTitleInfo.titles.indexOf(title) === -1;
		}
	});
	if(changedAttributes.text || titlesHaveChanged) {
		this.refreshSelf();
		return true;
	} else {
		return false;	
	}
};

exports.text = TextNodeWidget;

})();
