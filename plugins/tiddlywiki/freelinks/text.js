/*\
title: $:/plugins/tiddlywiki/freelinks/text.js
type: application/javascript
module-type: widget

An override of the core text widget that automatically linkifies the text, with support for non-Latin languages like Chinese, prioritizing longer titles, skipping processed matches, excluding the current tiddler title from linking, and handling large title sets with Aho-Corasick algorithm and fixed chunking (100 titles per chunk). Includes optional persistent caching of Aho-Corasick automaton, controlled by $:/config/Freelinks/PersistAhoCorasickCache.

\*/
(function() {

"use strict";

var TITLE_TARGET_FILTER = "$:/config/Freelinks/TargetFilter";
var PERSIST_CACHE_TIDDLER = "$:/config/Freelinks/PersistAhoCorasickCache";

var Widget = require("$:/core/modules/widgets/widget.js").widget,
    LinkWidget = require("$:/core/modules/widgets/link.js").link,
    ButtonWidget = require("$:/core/modules/widgets/button.js").button,
    ElementWidget = require("$:/core/modules/widgets/element.js").element;

// Escape only ASCII 127 and below metacharacters
function escapeRegExp(str) {
    try {
        return str.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
    } catch (e) {
        $tw.utils.warning("Failed to escape title:", str, e);
        return null; // Skip problematic titles
    }
}

// Aho-Corasick instance
var AhoCorasick = require("$:/plugins/tiddlywiki/freelinks/AhoCorasick.js").AhoCorasick;
var aho = new AhoCorasick();

var TextNodeWidget = function(parseTreeNode, options) {
    this.initialise(parseTreeNode, options);
};

/*
Inherit from the base widget class
*/
TextNodeWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
TextNodeWidget.prototype.render = function(parent, nextSibling) {
    this.parentDomNode = parent;
    this.computeAttributes();
    this.execute();
    this.renderChildren(parent, nextSibling);
};

/*
Compute the internal state of the widget
*/
TextNodeWidget.prototype.execute = function() {
    var self = this,
        ignoreCase = self.getVariable("tv-freelinks-ignore-case", { defaultValue: "no" }).trim() === "yes";
    // Get our parameters
    var childParseTree = [{
        type: "text",
        text: this.getAttribute("text", this.parseTreeNode.text || "")
    }];
    // Only process links if not disabled and we're not within a button or link widget
    if (this.getVariable("tv-wikilinks", { defaultValue: "yes" }).trim() !== "no" &&
        this.getVariable("tv-freelinks", { defaultValue: "no" }).trim() === "yes" &&
        !this.isWithinButtonOrLink()) {
        // Get the current tiddler title
        var currentTiddlerTitle = this.getVariable("currentTiddler") || "";
        // Check if persistent caching is enabled
        var usePersistent = this.wiki.getTiddlerText(PERSIST_CACHE_TIDDLER, "no") === "yes";
        var cacheKey = "tiddler-title-info-" + (ignoreCase ? "insensitive" : "sensitive");
        // Get or compute tiddler title info with caching
        this.tiddlerTitleInfo = this.wiki.getCache(cacheKey, function() {
            return computeTiddlerTitleInfo(self, ignoreCase);
        }, usePersistent);
        // Process titles to avoid overlapping matches
        if (this.tiddlerTitleInfo && this.tiddlerTitleInfo.titles.length > 0) {
            var text = childParseTree[0].text,
                newParseTree = [],
                currentPos = 0;
            // Use Aho-Corasick to find all matches
            var searchText = ignoreCase ? text.toLowerCase() : text;
            var matches = this.tiddlerTitleInfo.ac.search(searchText) || [];
            // Sort matches by position and length (longer titles first)
            matches.sort(function(a, b) {
                if (a.index !== b.index) return a.index - b.index;
                return b.length - a.length;
            });
            // Process matches to avoid overlaps
            var processedPositions = new Set();
            for (var i = 0; i < matches.length; i++) {
                var match = matches[i];
                var matchStart = match.index;
                var matchEnd = matchStart + match.length;
                // Skip if position already processed (ensures longer titles take precedence)
                var overlap = false;
                for (var pos = matchStart; pos < matchEnd; pos++) {
                    if (processedPositions.has(pos)) {
                        overlap = true;
                        break;
                    }
                }
                if (overlap) continue;
                // Mark positions as processed
                for (var pos = matchStart; pos < matchEnd; pos++) {
                    processedPositions.add(pos);
                }
                // Add text before the match
                if (matchStart > currentPos) {
                    newParseTree.push({
                        type: "text",
                        text: text.slice(currentPos, matchStart)
                    });
                }
                // Get matched title
                var matchedTitle = this.tiddlerTitleInfo.titles[match.titleIndex];
                // Check if the matched title is the current tiddler title
                if (matchedTitle === currentTiddlerTitle) {
                    // Skip linking, keep as plain text
                    newParseTree.push({
                        type: "text",
                        text: text.slice(matchStart, matchEnd)
                    });
                } else {
                    // Add link for the match
                    newParseTree.push({
                        type: "link",
                        attributes: {
                            to: { type: "string", value: matchedTitle },
                            "class": { type: "string", value: "tc-freelink" }
                        },
                        children: [{
                            type: "text",
                            text: text.slice(matchStart, matchEnd)
                        }]
                    });
                }
                currentPos = matchEnd;
            }
            // Add remaining text
            if (currentPos < text.length) {
                newParseTree.push({
                    type: "text",
                    text: text.substring(currentPos)
                });
            }
            childParseTree = newParseTree;
        }
    }
    // Make the child widgets
    this.makeChildWidgets(childParseTree);
};

/*
Helper function to compute tiddler title info
*/
function computeTiddlerTitleInfo(self, ignoreCase) {
    var targetFilterText = self.wiki.getTiddlerText(TITLE_TARGET_FILTER),
        titles = !!targetFilterText ? self.wiki.filterTiddlers(targetFilterText, $tw.rootWidget) : self.wiki.allTitles();
    if (!titles || titles.length === 0) {
        $tw.utils.warning("No titles found for Freelinks processing");
        return { titles: [], ac: new AhoCorasick(), chunkSize: 100, titleChunks: [] };
    }
    var sortedTitles = titles.sort(function(a, b) {
            var lenA = a.length,
                lenB = b.length;
            // Sort by length (longer first), then alphabetically for same length
            if (lenA !== lenB) return lenB - lenA;
            return a.localeCompare(b, 'zh', { sensitivity: 'base' });
        }),
        titles = [],
        chunkSize = 100; // Fixed chunk size
    var ac = new AhoCorasick();
    $tw.utils.each(sortedTitles, function(title, index) {
        if (title.substring(0, 3) !== "$:/") {
            var escapedTitle = escapeRegExp(title);
            if (escapedTitle) {
                titles.push(title);
                ac.addPattern(ignoreCase ? title.toLowerCase() : title, titles.length - 1);
            } else {
                $tw.utils.warning("Skipping invalid title:", title);
            }
        }
    });
    try {
        ac.buildFailureLinks();
    } catch (e) {
        $tw.utils.error("Failed to build Aho-Corasick failure links:", e);
        return { titles: [], ac: new AhoCorasick(), chunkSize: 100, titleChunks: [] };
    }
    // Split titles into chunks for memory management
    var titleChunks = [];
    for (var i = 0; i < titles.length; i += chunkSize) {
        titleChunks.push(titles.slice(i, i + chunkSize));
    }
    return {
        titles: titles,
        ac: ac,
        chunkSize: chunkSize,
        titleChunks: titleChunks
    };
}

/*
Check if the widget is within a button or link
*/
TextNodeWidget.prototype.isWithinButtonOrLink = function() {
    var withinButtonOrLink = false,
        widget = this.parentWidget;
    while (!withinButtonOrLink && widget) {
        withinButtonOrLink = widget instanceof ButtonWidget || widget instanceof LinkWidget ||
            ((widget instanceof ElementWidget) && widget.parseTreeNode.tag === "a");
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
    $tw.utils.each(changedTiddlers, function(change, title) {
        if (change.isDeleted) {
            titlesHaveChanged = true;
        } else {
            titlesHaveChanged = titlesHaveChanged || !self.tiddlerTitleInfo || self.tiddlerTitleInfo.titles.indexOf(title) === -1;
        }
    });
    if (changedAttributes.text || titlesHaveChanged) {
        // Invalidate cache if titles changed and persistent cache is enabled
        var usePersistent = self.wiki.getTiddlerText(PERSIST_CACHE_TIDDLER, "no") === "yes";
        var cacheKey = "tiddler-title-info-" + (self.getVariable("tv-freelinks-ignore-case", { defaultValue: "no" }).trim() === "yes" ? "insensitive" : "sensitive");
        if (titlesHaveChanged && usePersistent) {
            self.wiki.clearCache(cacheKey);
        }
        this.refreshSelf();
        return true;
    }
    return false;
};

exports.text = TextNodeWidget;

})();
