/*\
title: $:/plugins/tiddlywiki/freelinks/hook.js
type: application/javascript
module-type: startup

Turns runs of text into freelinks through the th-rendering-text hook, so the plugin does not
have to replace the core text widget.

Returning null leaves the run to core, so a wiki with freelinking switched off produces
exactly the DOM core produces on its own.

\*/

"use strict";

exports.name = "freelinks";
exports.platforms = ["browser","node"];
// Ordered like the other early modules. Without `before`, the task can be scheduled after
// `commands` and `render`, and the hook would be registered too late to affect anything
exports.after = ["load-modules"];
exports.before = ["startup"];
exports.synchronous = true;

var LinkWidget = require("$:/core/modules/widgets/link.js").link,
	ButtonWidget = require("$:/core/modules/widgets/button.js").button,
	ElementWidget = require("$:/core/modules/widgets/element.js").element,
	titles = require("$:/plugins/tiddlywiki/freelinks/titles.js"),
	matcher = require("$:/plugins/tiddlywiki/freelinks/matcher.js");

var TITLE_TARGET_FILTER = "$:/config/Freelinks/TargetFilter";
var WORD_BOUNDARY_TIDDLER = "$:/config/Freelinks/WordBoundary";
var MAX_LINKS_TIDDLER = "$:/config/Freelinks/MaxLinks";
var IGNORE_CASE_TIDDLER = "$:/config/Freelinks/IgnoreCase";
var LINK_IN_HEADINGS_TIDDLER = "$:/config/Freelinks/LinkInHeadings";
var LINK_NUMBERS_TIDDLER = "$:/config/Freelinks/LinkNumbers";
var LINK_ONCE_TIDDLER = "$:/config/Freelinks/LinkOnce";

var REFRESH_TRIGGERS = [
	TITLE_TARGET_FILTER,
	WORD_BOUNDARY_TIDDLER,
	MAX_LINKS_TIDDLER,
	IGNORE_CASE_TIDDLER,
	LINK_IN_HEADINGS_TIDDLER,
	LINK_NUMBERS_TIDDLER,
	LINK_ONCE_TIDDLER
];

var FIRST_OCCURRENCE_CACHE = "freelinks-first-occurrence";

// Automatons by wiki, used only when the indexer is unavailable: see getTitleInfo
var titleInfoByWiki = new WeakMap();

exports.startup = function() {
	$tw.hooks.addHook("th-rendering-text",renderText);
	$tw.hooks.addHook("th-refreshing-text",refreshText);
};

/*
Hooks stack, so leave a run alone if something else has already replaced it
*/
function renderText(value,widget) {
	if(value) {
		return value;
	}

	var text = widget.getAttribute("text",widget.parseTreeNode.text || "");
	if(!text || text.length < 2) {
		return value;
	}

	if(widget.getVariable("tv-wikilinks",{defaultValue:"yes"}) === "no" ||
		widget.getVariable("tv-freelinks",{defaultValue:"no"}) !== "yes" ||
		matcher.isEscapedNode(widget.parseTreeNode)) {
		return value;
	}

	var wiki = widget.wiki,
		linkInHeadings = wiki.getTiddlerText(LINK_IN_HEADINGS_TIDDLER,"no") === "yes",
		ancestry = scanAncestors(widget);

	if(ancestry.withinLink || (ancestry.withinHeading && !linkInHeadings)) {
		return value;
	}

	var ignoreCase = widget.getVariable("tv-freelinks-ignore-case",{defaultValue:"no"}).trim() === "yes",
		info = getTitleInfo(wiki,ignoreCase);

	// Recorded even when nothing is linked, so a title appearing later can be noticed
	widget.freelinksInfo = info;

	if(!info.titles.length) {
		return value;
	}

	return buildParseTree(widget,text,titleOptions(widget,text,ignoreCase,info,linkInHeadings)) || value;
}

function refreshText(value,widget,changedTiddlers) {
	if(value || !changedTiddlers) {
		return value;
	}

	for(var i = 0; i < REFRESH_TRIGGERS.length; i++) {
		if(changedTiddlers[REFRESH_TRIGGERS[i]]) {
			return true;
		}
	}

	// The whole info object is replaced when the eligible titles move, so comparing identity
	// answers "did anything I depend on change" without rescanning the change set
	var previous = widget.freelinksInfo;
	if(!previous) {
		return value;
	}
	var ignoreCase = widget.getVariable("tv-freelinks-ignore-case",{defaultValue:"no"}).trim() === "yes";
	return getTitleInfo(widget.wiki,ignoreCase) !== previous;
}

/*
One walk up the widget tree answers both questions.

`instanceof` catches a widget that subclasses LinkWidget under another name, which the node
level test in matcher.isLinkingNode cannot see. That test is therefore the narrower of the
two, and is used only by the LinkOnce replay, where being narrow costs nothing.
*/
function scanAncestors(widget) {
	var result = {withinLink: false, withinHeading: false},
		parent = widget.parentWidget;
	while(parent) {
		if(!result.withinLink && (parent instanceof ButtonWidget ||
			parent instanceof LinkWidget ||
			matcher.isLinkingNode(parent.parseTreeNode))) {
			result.withinLink = true;
		}
		if(!result.withinHeading && (parent instanceof ElementWidget) &&
			matcher.isHeadingNode(parent.parseTreeNode)) {
			result.withinHeading = true;
		}
		parent = parent.parentWidget;
	}
	return result;
}

function titleOptions(widget,text,ignoreCase,info,linkInHeadings) {
	var wiki = widget.wiki,
		currentTiddlerTitle = widget.getVariable("currentTiddler") || "",
		maxLinks = parseInt(wiki.getTiddlerText(MAX_LINKS_TIDDLER,"500"),10);

	if(isNaN(maxLinks) || maxLinks <= 0) {
		maxLinks = 500;
	}

	var options = {
		info: info,
		ignoreCase: ignoreCase,
		useWordBoundary: wiki.getTiddlerText(WORD_BOUNDARY_TIDDLER,"no") === "yes",
		maxLinks: maxLinks,
		linkNumbers: wiki.getTiddlerText(LINK_NUMBERS_TIDDLER,"no") === "yes",
		linkInHeadings: linkInHeadings,
		excludeTitle: ignoreCase ?
			(currentTiddlerTitle ? currentTiddlerTitle.toLowerCase() : "") :
			currentTiddlerTitle,
		// `<$text text="~Homer"/>` is a literal string the author asked to be shown as
		// written, so the escape applies only to text that came from wikitext
		escapeTilde: !(widget.parseTreeNode.attributes && widget.parseTreeNode.attributes.text)
	};

	if(wiki.getTiddlerText(LINK_ONCE_TIDDLER,"no") === "yes") {
		var offset = getSourceOffset(widget,currentTiddlerTitle,text);
		if(offset === undefined) {
			// The run cannot be located in the tiddler source, so fall back to suppressing
			// repeats within this run rather than dropping the setting entirely
			options.onceWithinRun = true;
		} else {
			options.baseOffset = offset;
			options.firstOccurrences = getFirstOccurrences(widget,currentTiddlerTitle,options);
		}
	}

	return options;
}

/*
Offset of this run within the source of the current tiddler, or undefined when it did not
come from there. A run built from a `text` attribute, from a view template, or from a tiddler
parsed under `\whitespace trim` will not line up, so the text is compared against the source
rather than trusting the recorded position.
*/
function getSourceOffset(widget,currentTiddlerTitle,text) {
	var start = widget.parseTreeNode.start;
	if(start === undefined || !currentTiddlerTitle) {
		return undefined;
	}
	var source = widget.wiki.getTiddlerText(currentTiddlerTitle);
	if(source === undefined || source.substring(start,start + text.length) !== text) {
		return undefined;
	}
	return start;
}

/*
Where each title first earns a link within the current tiddler, cached per tiddler.
getCacheForTiddler is dropped when that tiddler changes, but not when some other tiddler is
created or deleted, which is what changes the title set, so the automaton it was built
against is kept alongside it.
*/
function getFirstOccurrences(widget,currentTiddlerTitle,options) {
	var wiki = widget.wiki;
	var cached = wiki.getCacheForTiddler(currentTiddlerTitle,FIRST_OCCURRENCE_CACHE,function() {
		return {info: null, map: null};
	});
	if(cached.info !== options.info) {
		cached.info = options.info;
		cached.map = matcher.collectFirstOccurrences(wiki,currentTiddlerTitle,options);
	}
	return cached.map;
}

/*
The automaton must not live in the wiki global cache, which core empties on every tiddler
write. Normally the plugin's indexer owns it: core discovers indexers by module type, hands
them every write, and never clears them. Safe mode constructs the wiki without indexers, so
the fallback keeps it per wiki and rebuilds only when the eligible titles differ.
*/
function getTitleInfo(wiki,ignoreCase) {
	var indexer = wiki.getIndexer && wiki.getIndexer("FreelinksIndexer");
	if(indexer) {
		return indexer.getTitleInfo(ignoreCase);
	}

	var entry = titleInfoByWiki.get(wiki);
	if(!entry) {
		entry = Object.create(null);
		titleInfoByWiki.set(wiki,entry);
	}

	var key = ignoreCase ? "insensitive" : "sensitive",
		eligible = titles.eligibleTitles(wiki),
		cached = entry[key];

	if(cached && titles.sameTitles(cached.sourceTitles,eligible)) {
		return cached;
	}

	entry[key] = titles.buildTitleInfo(eligible,ignoreCase);
	return entry[key];
}

/*
Assemble the replacement nodes, or null when there is nothing to change
*/
function buildParseTree(widget,text,options) {
	var selection = matcher.selectMatches(text,options),
		validMatches = selection.matches,
		escapedTildes = selection.escapedTildes;

	if(validMatches.length === 0 && !escapedTildes) {
		return null;
	}

	// A `~` is only removed where it suppressed a link, so an ordinary tilde such as the one
	// in "~5 minutes" is left in the text
	var pushPlainText = function(tree,from,to) {
		if(to <= from) return;
		var plain;
		if(escapedTildes) {
			plain = "";
			for(var p = from; p < to; p++) {
				if(!escapedTildes[p]) {
					plain += text.charAt(p);
				}
			}
		} else {
			plain = text.substring(from,to);
		}
		if(plain) {
			tree.push({type: "plain-text", text: plain});
		}
	};

	validMatches.sort(function(a,b){ return a.index - b.index; });

	var newParseTree = [],
		curPos = 0;

	for(var x = 0; x < validMatches.length; x++) {
		var mm = validMatches[x],
			s = mm.index,
			e = s + mm.length;

		pushPlainText(newParseTree,curPos,s);

		newParseTree.push({
			type: "link",
			attributes: {
				to: {type: "string", value: options.info.titles[mm.titleIndex]},
				"class": {type: "string", value: "tc-freelink"}
			},
			children: [{
				type: "plain-text",
				text: text.substring(s,e)
			}]
		});

		curPos = e;
	}

	pushPlainText(newParseTree,curPos,text.length);

	return newParseTree.length > 0 ? newParseTree : [{type: "plain-text", text: ""}];
}
