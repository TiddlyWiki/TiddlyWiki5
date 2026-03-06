/*\

title: $:/core/modules/widgets/text.js
type: application/javascript
module-type: widget

Optimized override of the core text widget that automatically linkifies text.
- Supports non-Latin languages like Chinese.
- Global longest-match priority, then removes overlaps.
- Excludes current tiddler title from linking.
- Uses Aho-Corasick for performance.

\*/

"use strict";

var TITLE_TARGET_FILTER = "$:/config/Freelinks/TargetFilter";
var WORD_BOUNDARY_TIDDLER = "$:/config/Freelinks/WordBoundary";

var Widget = require("$:/core/modules/widgets/widget.js").widget,
	LinkWidget = require("$:/core/modules/widgets/link.js").link,
	ButtonWidget = require("$:/core/modules/widgets/button.js").button,
	ElementWidget = require("$:/core/modules/widgets/element.js").element,
	AhoCorasick = require("$:/core/modules/utils/aho-corasick.js").AhoCorasick;

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
	var self = this;
	var ignoreCase = self.getVariable("tv-freelinks-ignore-case",{defaultValue:"no"}).trim() === "yes";

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
		var useWordBoundary = self.wiki.getTiddlerText(WORD_BOUNDARY_TIDDLER,"no") === "yes";

		var cacheKey = "tiddler-title-info-" + (ignoreCase ? "insensitive" : "sensitive");
		this.tiddlerTitleInfo = this.wiki.getGlobalCache(cacheKey,function() {
			return computeTiddlerTitleInfo(self,ignoreCase);
		});

		if(this.tiddlerTitleInfo && this.tiddlerTitleInfo.titles && this.tiddlerTitleInfo.titles.length > 0 && this.tiddlerTitleInfo.ac) {
			var newParseTree = this.processTextWithMatches(text,currentTiddlerTitle,ignoreCase,useWordBoundary);
			if(newParseTree && newParseTree.length > 0 &&
				(newParseTree.length > 1 || newParseTree[0].type !== "plain-text")) {
				childParseTree = newParseTree;
			}
		}
	}

	this.makeChildWidgets(childParseTree);
};

TextNodeWidget.prototype.processTextWithMatches = function(text,currentTiddlerTitle,ignoreCase,useWordBoundary) {
	if(!text || text.length === 0) {
		return [{type: "plain-text", text: text}];
	}

	var matches;
	try {
		matches = this.tiddlerTitleInfo.ac.search(text, useWordBoundary, ignoreCase);
	} catch(e) {
		return [{type: "plain-text", text: text}];
	}

	if(!matches || matches.length === 0) {
		return [{type: "plain-text", text: text}];
	}

	var titleToCompare = ignoreCase ?
		(currentTiddlerTitle ? currentTiddlerTitle.toLowerCase() : "") :
		currentTiddlerTitle;

	matches.sort(function(a,b) {
		if(b.length !== a.length) return b.length - a.length;
		return a.index - b.index;
	});

	var occupied = new Uint8Array(text.length);
	var validMatches = [];

	for(var i = 0; i < matches.length; i++) {
		var m = matches[i];
		var start = m.index;
		var end = start + m.length;
		if(start < 0 || end > text.length) continue;

		var matchedTitle = this.tiddlerTitleInfo.titles[m.titleIndex];
		if(!matchedTitle) continue;

		var matchedTitleToCompare = ignoreCase ? matchedTitle.toLowerCase() : matchedTitle;
		if(titleToCompare && matchedTitleToCompare === titleToCompare) continue;

		var overlapping = false;
		for(var j = start; j < end; j++) {
			if(occupied[j]) { overlapping = true; break; }
		}
		if(overlapping) continue;

		validMatches.push(m);
		for(var k = start; k < end; k++) {
			occupied[k] = 1;
		}
	}

	if(validMatches.length === 0) {
		return [{type: "plain-text", text: text}];
	}

	validMatches.sort(function(a,b){ return a.index - b.index; });

	var newParseTree = [];
	var curPos = 0;

	for(var x = 0; x < validMatches.length; x++) {
		var mm = validMatches[x];
		var s = mm.index;
		var e = s + mm.length;

		if(s > curPos) {
			newParseTree.push({ type: "plain-text", text: text.substring(curPos,s) });
		}

		var toTitle = this.tiddlerTitleInfo.titles[mm.titleIndex];
		var matchedText = text.substring(s,e);

		newParseTree.push({
			type: "link",
			attributes: {
				to: {type: "string", value: toTitle},
				"class": {type: "string", value: "tc-freelink"}
			},
			children: [{
				type: "plain-text",
				text: matchedText
			}]
		});

		curPos = e;
	}

	if(curPos < text.length) {
		newParseTree.push({ type: "plain-text", text: text.substring(curPos) });
	}

	return newParseTree;
};

function computeTiddlerTitleInfo(self,ignoreCase) {
	var targetFilterText = self.wiki.getTiddlerText(TITLE_TARGET_FILTER),
		titles = targetFilterText ?
			self.wiki.filterTiddlers(targetFilterText,$tw.rootWidget) :
			self.wiki.allTitles();

	if(!titles || titles.length === 0) {
		return { titles: [], ac: new AhoCorasick() };
	}

	var validTitles = [];
	for(var i = 0; i < titles.length; i++) {
		var t = titles[i];
		if(t && t.length > 0 && t.substring(0,3) !== "$:/") {
			validTitles.push(t);
		}
	}

	validTitles.sort(function(a,b) {
		var d = b.length - a.length;
		if(d !== 0) return d;
		return a < b ? -1 : a > b ? 1 : 0;
	});

	var ac = new AhoCorasick();
	for(var j = 0; j < validTitles.length; j++) {
		var title = validTitles[j];
		var pattern = ignoreCase ? title.toLowerCase() : title;
		ac.addPattern(pattern,j);
	}

	try {
		ac.buildFailureLinks();
	} catch(e) {
		return { titles: [], ac: new AhoCorasick() };
	}

	return { titles: validTitles, ac: ac };
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
	var self = this;
	var changedAttributes = this.computeAttributes();
	var titlesHaveChanged = false;

	if(changedTiddlers) {
		$tw.utils.each(changedTiddlers,function(change,title) {
			if(titlesHaveChanged) return;

			if(title === WORD_BOUNDARY_TIDDLER || title === TITLE_TARGET_FILTER) {
				titlesHaveChanged = true;
				return;
			}

			if(title.substring(0,3) === "$:/") {
				return;
			}

			if(change && change.isDeleted) {
				if(self.tiddlerTitleInfo && self.tiddlerTitleInfo.titles && self.tiddlerTitleInfo.titles.indexOf(title) !== -1) {
					titlesHaveChanged = true;
				}
				return;
			}

			var tiddler = self.wiki.getTiddler(title);
			if(tiddler && tiddler.hasField("draft.of")) {
				return;
			}

			if(!self.tiddlerTitleInfo || !self.tiddlerTitleInfo.titles || self.tiddlerTitleInfo.titles.indexOf(title) === -1) {
				titlesHaveChanged = true;
			}
		});
	}

	var wordBoundaryChanged = !!(changedTiddlers && changedTiddlers[WORD_BOUNDARY_TIDDLER]);

	if(changedAttributes.text || titlesHaveChanged || wordBoundaryChanged) {
		if(titlesHaveChanged) {
			self.wiki.clearCache("tiddler-title-info-insensitive");
			self.wiki.clearCache("tiddler-title-info-sensitive");
		}
		this.refreshSelf();
		return true;
	}

	if(changedTiddlers) {
		return this.refreshChildren(changedTiddlers);
	}
	return false;
};

exports.text = TextNodeWidget;
