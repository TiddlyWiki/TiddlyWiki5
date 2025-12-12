/*\
title: $:/core/modules/widgets/text.js
type: application/javascript
module-type: widget

An optimized override of the core text widget that automatically linkifies the text, with support for non-Latin languages like Chinese, prioritizing longer titles, skipping processed matches, excluding the current tiddler title from linking, and handling large title sets with enhanced Aho-Corasick algorithm.

\*/

"use strict";

var TITLE_TARGET_FILTER = "$:/config/Freelinks/TargetFilter";
var WORD_BOUNDARY_TIDDLER = "$:/config/Freelinks/WordBoundary";

var Widget = require("$:/core/modules/widgets/widget.js").widget,
	LinkWidget = require("$:/core/modules/widgets/link.js").link,
	ButtonWidget = require("$:/core/modules/widgets/button.js").button,
	ElementWidget = require("$:/core/modules/widgets/element.js").element,
	AhoCorasick = require("$:/core/modules/utils/aho-corasick.js").AhoCorasick;

var ESCAPE_REGEX = /[\\^$*+?.()|[\]{}]/g;

function escapeRegExp(str) {
	try {
		return str.replace(ESCAPE_REGEX, "\\$&");
	} catch(e) {
		return null;
	}
}

function FastPositionSet() {
	this.set = new Set();
}

FastPositionSet.prototype.add = function(pos) {
	this.set.add(pos);
};

FastPositionSet.prototype.has = function(pos) {
	return this.set.has(pos);
};

var TextNodeWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

TextNodeWidget.prototype = new Widget();

TextNodeWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

TextNodeWidget.prototype.execute = function() {
	var self = this,
		ignoreCase = self.getVariable("tv-freelinks-ignore-case",{defaultValue:"no"}).trim() === "yes";
	
	var childParseTree = [{
		type: "plain-text",
		text: this.getAttribute("text",this.parseTreeNode.text || "")
	}];
	
	var text = childParseTree[0].text;
	
	if(!text || text.length < 2) {
		this.makeChildWidgets(childParseTree);
		return;
	}
	
	if(this.getVariable("tv-wikilinks",{defaultValue:"yes"}) !== "no" && 
	   this.getVariable("tv-freelinks",{defaultValue:"no"}) === "yes" && 
	   !this.isWithinButtonOrLink()) {
		
		var currentTiddlerTitle = this.getVariable("currentTiddler") || "";
		var useWordBoundary = self.wiki.getTiddlerText(WORD_BOUNDARY_TIDDLER, "no") === "yes";
		
		var cacheKey = "tiddler-title-info-" + (ignoreCase ? "insensitive" : "sensitive");
		
		this.tiddlerTitleInfo = this.wiki.getGlobalCache(cacheKey, function() {
			return computeTiddlerTitleInfo(self, ignoreCase);
		});
		
		if(this.tiddlerTitleInfo.titles.length > 0) {
			var newParseTree = this.processTextWithMatches(text, currentTiddlerTitle, ignoreCase, useWordBoundary);
			if(newParseTree.length > 1 || newParseTree[0].type !== "plain-text") {
				childParseTree = newParseTree;
			}
		}
	}
	
	this.makeChildWidgets(childParseTree);
};

TextNodeWidget.prototype.processTextWithMatches = function(text, currentTiddlerTitle, ignoreCase, useWordBoundary) {
	var searchText = ignoreCase ? text.toLowerCase() : text;
	var matches;
	
	try {
		matches = this.tiddlerTitleInfo.ac.search(searchText, useWordBoundary);
	} catch(e) {
		return [{type: "plain-text", text: text}];
	}
	
	if(!matches || matches.length === 0) {
		return [{type: "plain-text", text: text}];
	}
	
	matches.sort(function(a, b) {
		var posDiff = a.index - b.index;
		return posDiff !== 0 ? posDiff : b.length - a.length;
	});
	
	var processedPositions = new FastPositionSet();
	var validMatches = [];
	
	for(var i = 0; i < matches.length; i++) {
		var match = matches[i];
		var matchStart = match.index;
		var matchEnd = matchStart + match.length;
		
		var hasOverlap = false;
		for(var pos = matchStart; pos < matchEnd && !hasOverlap; pos++) {
			if(processedPositions.has(pos)) {
				hasOverlap = true;
			}
		}
		
		if(!hasOverlap) {
			for(var pos = matchStart; pos < matchEnd; pos++) {
				processedPositions.add(pos);
			}
			validMatches.push(match);
		}
	}
	
	if(validMatches.length === 0) {
		return [{type: "plain-text", text: text}];
	}
	
	var newParseTree = [];
	var currentPos = 0;
	
	for(var i = 0; i < validMatches.length; i++) {
		var match = validMatches[i];
		var matchStart = match.index;
		var matchEnd = matchStart + match.length;
		
		if(matchStart > currentPos) {
			newParseTree.push({
				type: "plain-text",
				text: text.slice(currentPos, matchStart)
			});
		}
		
		var matchedTitle = this.tiddlerTitleInfo.titles[match.titleIndex];
		
		if(matchedTitle === currentTiddlerTitle) {
			newParseTree.push({
				type: "plain-text",
				text: text.slice(matchStart, matchEnd)
			});
		} else {
			newParseTree.push({
				type: "link",
				attributes: {
					to: {type: "string", value: matchedTitle},
					"class": {type: "string", value: "tc-freelink"}
				},
				children: [{
					type: "plain-text",
					text: text.slice(matchStart, matchEnd)
				}]
			});
		}
		currentPos = matchEnd;
	}
	
	if(currentPos < text.length) {
		newParseTree.push({
			type: "plain-text",
			text: text.slice(currentPos)
		});
	}
	
	return newParseTree;
};

function computeTiddlerTitleInfo(self, ignoreCase) {
	var targetFilterText = self.wiki.getTiddlerText(TITLE_TARGET_FILTER),
		titles = !!targetFilterText ? 
			self.wiki.filterTiddlers(targetFilterText,$tw.rootWidget) : 
			self.wiki.allTitles();
	
	if(!titles || titles.length === 0) {
		return { 
			titles: [], 
			ac: new AhoCorasick()
		};
	}
	
	var validTitles = [];
	var ac = new AhoCorasick();
	
	// Process titles in a single pass to avoid duplication
	for(var i = 0; i < titles.length; i++) {
		var title = titles[i];
		if(title && title.length > 0 && title.substring(0,3) !== "$:/") {
			var escapedTitle = escapeRegExp(title);
			if(escapedTitle) {
				validTitles.push(title);
			}
		}
	}
	
	// Sort by length (descending) then alphabetically
	// Longer titles are prioritized to avoid partial matches (e.g., "JavaScript" before "Java")
	var sortedTitles = validTitles.sort(function(a,b) {
		var lenDiff = b.length - a.length;
		return lenDiff !== 0 ? lenDiff : (a < b ? -1 : a > b ? 1 : 0);
	});
	
	// Build Aho-Corasick automaton
	for(var i = 0; i < sortedTitles.length; i++) {
		var title = sortedTitles[i];
		ac.addPattern(ignoreCase ? title.toLowerCase() : title, i);
	}
	
	try {
		ac.buildFailureLinks();
	} catch(e) {
		return { 
			titles: [], 
			ac: new AhoCorasick()
		};
	}
	
	return {
		titles: sortedTitles,
		ac: ac
	};
}

TextNodeWidget.prototype.isWithinButtonOrLink = function() {
	var widget = this.parentWidget;
	while(widget) {
		if(widget instanceof ButtonWidget || 
		   widget instanceof LinkWidget || 
		   ((widget instanceof ElementWidget) && widget.parseTreeNode.tag === "a")) {
			return true;
		}
		widget = widget.parentWidget;
	}
	return false;
};

TextNodeWidget.prototype.refresh = function(changedTiddlers) {
	var self = this,
		changedAttributes = this.computeAttributes(),
		titlesHaveChanged = false;
	
	if(changedTiddlers) {
		$tw.utils.each(changedTiddlers,function(change,title) {
			if(change.isDeleted) {
				titlesHaveChanged = true;
			} else {
				titlesHaveChanged = titlesHaveChanged || 
								   !self.tiddlerTitleInfo || 
								   self.tiddlerTitleInfo.titles.indexOf(title) === -1;
			}
		});
	}
	
	if(changedAttributes.text || titlesHaveChanged || 
	   (changedTiddlers && changedTiddlers[WORD_BOUNDARY_TIDDLER])) {
		if(titlesHaveChanged) {
			var ignoreCase = self.getVariable("tv-freelinks-ignore-case",{defaultValue:"no"}).trim() === "yes";
			var cacheKey = "tiddler-title-info-" + (ignoreCase ? "insensitive" : "sensitive");
			self.wiki.clearCache(cacheKey);
		}
		
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);
	}
};

exports.text = TextNodeWidget;
