/*\
title: $:/core/modules/widgets/text.js
type: application/javascript
module-type: widget

An override of the core text widget that automatically linkifies the text, with support for non-Latin languages like Chinese, prioritizing longer titles, skipping processed matches, excluding the current tiddler title from linking, and handling large title sets with Aho-Corasick algorithm and fixed chunking (100 titles per chunk). Includes optional persistent caching of Aho-Corasick automaton, controlled by $:/config/Freelinks/PersistAhoCorasickCache.

\*/

"use strict";

var TITLE_TARGET_FILTER = "$:/config/Freelinks/TargetFilter";
var PERSIST_CACHE_TIDDLER = "$:/config/Freelinks/PersistAhoCorasickCache";

var Widget = require("$:/core/modules/widgets/widget.js").widget,
	LinkWidget = require("$:/core/modules/widgets/link.js").link,
	ButtonWidget = require("$:/core/modules/widgets/button.js").button,
	ElementWidget = require("$:/core/modules/widgets/element.js").element,
	AhoCorasick = require("$:/core/modules/utils/aho-corasick.js").AhoCorasick;

/*
Escape only ASCII 127 and below metacharacters to avoid issues with Unicode titles
*/
function escapeRegExp(str) {
	try {
		return str.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
	} catch(e) {
		return null;
	}
}

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
		ignoreCase = self.getVariable("tv-freelinks-ignore-case",{defaultValue:"no"}) === "yes";
	
	var childParseTree = [{
		type: "plain-text",
		text: this.getAttribute("text",this.parseTreeNode.text || "")
	}];
	
	// Only process if freelinks enabled and not within interactive elements (prevents nested links)
	if(this.getVariable("tv-wikilinks",{defaultValue:"yes"}) !== "no" && 
		this.getVariable("tv-freelinks",{defaultValue:"no"}) === "yes" && 
		!this.isWithinButtonOrLink()) {
		
		var currentTiddlerTitle = this.getVariable("currentTiddler") || "";
		
		// Cache strategy: persistent vs session-based depending on configuration
		var persistCache = self.wiki.getTiddlerText(PERSIST_CACHE_TIDDLER, "no") === "yes";
		var cacheKey = "tiddler-title-info-" + (ignoreCase ? "insensitive" : "sensitive");
		
		this.tiddlerTitleInfo = persistCache ?
			this.wiki.getPersistentCache(cacheKey, function() {
				return computeTiddlerTitleInfo(self, ignoreCase);
			}) :
			this.wiki.getGlobalCache(cacheKey, function() {
				return computeTiddlerTitleInfo(self, ignoreCase);
			});
		
		if(this.tiddlerTitleInfo.titles.length > 0) {
			var text = childParseTree[0].text,
				newParseTree = [],
				currentPos = 0;
			
			var searchText = ignoreCase ? text.toLowerCase() : text;
			var matches;
			try {
				matches = this.tiddlerTitleInfo.ac.search(searchText);
			} catch(e) {
				matches = [];
			}
			
			// Prioritize longer matches first, then by position
			matches.sort(function(a, b) {
				if(a.index !== b.index) {
					return a.index - b.index;
				}
				return b.length - a.length;
			});
			
			// Prevent overlapping matches - longer titles take precedence
			var processedPositions = new Set();
			for(var i = 0; i < matches.length; i++) {
				var match = matches[i];
				var matchStart = match.index;
				var matchEnd = matchStart + match.length;
				
				var overlap = false;
				for(var pos = matchStart; pos < matchEnd; pos++) {
					if(processedPositions.has(pos)) {
						overlap = true;
						break;
					}
				}
				if(overlap) {
					continue;
				}
				
				for(var pos = matchStart; pos < matchEnd; pos++) {
					processedPositions.add(pos);
				}
				
				if(matchStart > currentPos) {
					newParseTree.push({
						type: "plain-text",
						text: text.slice(currentPos, matchStart)
					});
				}
				
				var matchedTitle = this.tiddlerTitleInfo.titles[match.titleIndex];
				
				// Self-referential links are rendered as plain text to avoid circular navigation
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
			childParseTree = newParseTree;
		}
	}
	
	this.makeChildWidgets(childParseTree);
};

/*
Builds optimized title search structure with chunking for memory management
*/
function computeTiddlerTitleInfo(self, ignoreCase) {
	var targetFilterText = self.wiki.getTiddlerText(TITLE_TARGET_FILTER),
		titles = !!targetFilterText ? 
			self.wiki.filterTiddlers(targetFilterText,$tw.rootWidget) : 
			self.wiki.allTitles();
	
	if(!titles || titles.length === 0) {
		return { 
			titles: [], 
			ac: new AhoCorasick(), 
			chunkSize: 100, 
			titleChunks: [] 
		};
	}
	
	// Longer titles prioritized for better matching, with Chinese locale support
	var sortedTitles = titles.sort(function(a,b) {
			var lenA = a.length,
				lenB = b.length;
			if(lenA !== lenB) {
				return lenB - lenA;
			} else {
				return a.localeCompare(b, 'zh', {sensitivity: 'base'});
			}
		}),
		validTitles = [],
		chunkSize = 100;
	
	var ac = new AhoCorasick();
	
	$tw.utils.each(sortedTitles,function(title, index) {
		// Exclude system tiddlers from linking
		if(title.substring(0,3) !== "$:/") {
			var escapedTitle = escapeRegExp(title);
			if(escapedTitle) {
				validTitles.push(title);
				ac.addPattern(ignoreCase ? title.toLowerCase() : title, validTitles.length - 1);
			}
		}
	});
	
	try {
		ac.buildFailureLinks();
	} catch(e) {
		return { 
			titles: [], 
			ac: new AhoCorasick(), 
			chunkSize: 100, 
			titleChunks: [] 
		};
	}
	
	// Memory optimization through fixed-size chunking
	var titleChunks = [];
	for(var i = 0; i < validTitles.length; i += chunkSize) {
		titleChunks.push(validTitles.slice(i, i + chunkSize));
	}
	
	return {
		titles: validTitles,
		ac: ac,
		chunkSize: chunkSize,
		titleChunks: titleChunks
	};
}

/*
Guards against nested interactive elements which break accessibility
*/
TextNodeWidget.prototype.isWithinButtonOrLink = function() {
	var withinButtonOrLink = false,
		widget = this.parentWidget;
	while(!withinButtonOrLink && widget) {
		withinButtonOrLink = widget instanceof ButtonWidget || 
							widget instanceof LinkWidget || 
							((widget instanceof ElementWidget) && widget.parseTreeNode.tag === "a");
		widget = widget.parentWidget;
	}
	return withinButtonOrLink;
};

TextNodeWidget.prototype.refresh = function(changedTiddlers) {
	var self = this,
		changedAttributes = this.computeAttributes(),
		titlesHaveChanged = false;
	
	$tw.utils.each(changedTiddlers,function(change,title) {
		if(change.isDeleted) {
			titlesHaveChanged = true;
		} else {
			titlesHaveChanged = titlesHaveChanged || 
							   !self.tiddlerTitleInfo || 
							   self.tiddlerTitleInfo.titles.indexOf(title) === -1;
		}
	});
	
	if(changedAttributes.text || titlesHaveChanged) {
		// Cache invalidation strategy for persistent vs session caches
		var persistCache = self.wiki.getTiddlerText(PERSIST_CACHE_TIDDLER, "no") === "yes";
		var ignoreCase = self.getVariable("tv-freelinks-ignore-case",{defaultValue:"no"}) === "yes";
		var cacheKey = "tiddler-title-info-" + (ignoreCase ? "insensitive" : "sensitive");
		
		if(titlesHaveChanged && persistCache) {
			self.wiki.clearCache(cacheKey);
		}
		
		this.refreshSelf();
		return true;
	} else {
		return false;
	}
};

exports.text = TextNodeWidget;
