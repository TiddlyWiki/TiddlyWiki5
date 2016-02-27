/*\
title: $:/plugins/tiddlywiki/text-slicer/modules/slicer.js
type: application/javascript
module-type: global

Main text-slicing logic

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var DOMParser = require("$:/plugins/tiddlywiki/xmldom/dom-parser").DOMParser;

var SLICER_OUTPUT_TITLE = "$:/TextSlicer";

function Slicer(wiki,sourceTitle,options) {
	options = options || {};
	this.wiki = wiki;
	this.sourceTitle = sourceTitle;
	this.sourceTiddler = wiki.getTiddler(this.sourceTitle);
	this.destTitle = options.destTitle || this.sourceTiddler.fields["doc-split-to"] || ("Sliced up " + this.sourceTitle);
	this.iframe = null; // Reference to iframe used for HTML parsing
	this.stopWordList = "the and a of on i".split(" ");
	this.tiddlers = {};
	this.parentStack = []; // Stack of parent heading or list
	this.containerStack = []; // Stack of elements containing other elements
	this.sliceTitle = null;
	this.slicers = $tw.modules.applyMethods("slicer");
	this.anchors = Object.create(null); // Hashmap of HTML anchor ID to tiddler title
}

Slicer.prototype.destroy = function() {
	// Remove the iframe from the DOM
	if(this.iframe && this.iframe.parentNode) {
		this.iframe.parentNode.removeChild(this.iframe);
	}
};

Slicer.prototype.addTiddler = function(fields) {
	if(fields.title) {
		this.tiddlers[fields.title] = $tw.utils.extend({},this.tiddlers[fields.title],fields);
		return fields.title;
	} else {
		return null;
	}
};

Slicer.prototype.addToList = function(parent,child) {
	var parentTiddler = this.tiddlers[parent] || {},
		parentList = parentTiddler.list || [];
	parentList.push(child);
	this.addTiddler($tw.utils.extend({title: parent},parentTiddler,{list: parentList}));
};

Slicer.prototype.insertBeforeListItem = function(parent,child,beforeSibling) {
	var parentTiddler = this.tiddlers[parent] || {},
		parentList = parentTiddler.list || [],
		parentListSiblingPosition = parentList.indexOf(beforeSibling);
	if(parentListSiblingPosition !== -1) {
		parentList.splice(parentListSiblingPosition,0,child)
		this.addTiddler($tw.utils.extend({title: parent},parentTiddler,{list: parentList}));
	}

	else {debugger;}
};

Slicer.prototype.popParentStackUntil = function(type) {
	// Pop the stack to remove any entries at the same or lower level
	var newLevel = this.convertTypeToLevel(type),
		topIndex = this.parentStack.length - 1;
	do {
		var topLevel = this.convertTypeToLevel(this.parentStack[this.parentStack.length - 1].type);
		if(topLevel !== null && topLevel < newLevel ) {
			break;
		}
		this.parentStack.length--;
	} while(true);
	return this.parentStack[this.parentStack.length - 1].title;
};

Slicer.prototype.getTopContainer = function() {
	return this.containerStack[this.containerStack.length-1];
};

Slicer.prototype.appendToCurrentContainer = function(newText) {
	var title = this.containerStack[this.containerStack.length-1];
	if(title) {
		var tiddler = this.tiddlers[title] || {},
			text = tiddler.text || "";
		this.addTiddler($tw.utils.extend({title: title},tiddler,{text: text + newText}));
	}

	else {debugger;}
};

Slicer.prototype.convertTypeToLevel = function(type) {
	if(type.charAt(0) === "h") {
		return parseInt(type.charAt(1),10);			
	} else {
		return null;
	}
};

Slicer.prototype.isBlank = function(s) {
	return (/^[\s\xA0]*$/g).test(s);
};

Slicer.prototype.getSourceHtmlDocument = function(tiddler) {
	if($tw.browser) {
		this.iframe = document.createElement("iframe");
		document.body.appendChild(this.iframe);
		this.iframe.contentWindow.document.open();
		this.iframe.contentWindow.document.write(tiddler.fields.text);
		this.iframe.contentWindow.document.close();
		return this.iframe.contentWindow.document;
	} else {
		return new DOMParser().parseFromString(tiddler.fields.text);
	}
};

Slicer.prototype.getSourceWikiDocument = function(tiddler) {
	var widgetNode = this.wiki.makeTranscludeWidget(this.sourceTitle,{document: $tw.fakeDocument, parseAsInline: false}),
		container = $tw.fakeDocument.createElement("div");
	widgetNode.render(container,null);
	return container;
};

Slicer.prototype.getSourceDocument = function() {
	if(this.sourceTiddler.fields.type === "text/html") {
		return this.getSourceHtmlDocument(this.sourceTiddler);
	} else {
		return this.getSourceWikiDocument(this.sourceTiddler);
	}
};

Slicer.prototype.makeUniqueTitle = function(prefix,rawText) {
	// Remove characters other than lowercase alphanumeric and spaces
	var self = this,
		cleanText;
	if(rawText) {
		// Replace non alpha characters with spaces
		cleanText = rawText.toLowerCase().replace(/[^\s\xA0]/mg,function($0,$1,$2) {
			if(($0 >= "a" && $0 <= "z") || ($0 >= "0" && $0 <= "9")) {
				return $0;
			} else {
				return " ";
			}
		});
		// Split on word boundaries
		var words = cleanText.split(/[\s\xA0]+/mg);
		// Remove common words
		words = words.filter(function(word) {
			return word && (self.stopWordList.indexOf(word) === -1);
		});
		// Accumulate the number of words that will fit
		var c = 0,
			s = "";
		while(c < words.length && (s.length + words[c].length + 1) < 50) {
			s += "-" + words[c++];
		}
		prefix = prefix + s;
	}
	// Check for duplicates
	var baseTitle = prefix;
	c = 0;
	var title = baseTitle;
	while(this.tiddlers[title] || this.wiki.tiddlerExists(title) || this.wiki.isShadowTiddler(title) || this.wiki.findDraft(title)) {
		title = baseTitle + "-" + (++c);
	}
	return title;
};

Slicer.prototype.registerAnchor = function(id) {
	this.anchors[id] = this.currentTiddler;
}

Slicer.prototype.processNodeList = function(domNodeList) {
	$tw.utils.each(domNodeList,this.processNode.bind(this));
}

Slicer.prototype.processNode = function(domNode) {
	var nodeType = domNode.nodeType,
		tagName = (domNode.tagName || "").toLowerCase(),
		hasProcessed = false;
	for(var slicerTitle in this.slicers) {
		var slicer = this.slicers[slicerTitle];
		if(slicer.bind(this)(domNode,tagName)) {
			hasProcessed = true;
			break;
		}
	}
	if(!hasProcessed) {
		if(nodeType === 1 && domNode.hasChildNodes()) {
			this.processNodeList(domNode.childNodes);
		}
	}
};

// Slice a tiddler into individual tiddlers
Slicer.prototype.sliceTiddler = function() {
	var sliceTitle,sliceTiddler = {};
	if(this.sourceTiddler) {
		sliceTiddler = $tw.utils.extend({},this.sourceTiddler.fields);
	}
	sliceTiddler.title = this.destTitle;
	sliceTiddler.text =  "Document sliced at " + (new Date());
	sliceTiddler.type = "text/vnd.tiddlywiki";
	sliceTiddler.tags = [];
	sliceTiddler.list = [];
	sliceTiddler["toc-type"] = "document";
	var domNode = this.getSourceDocument();
	this.parentStack.push({type: "h0", title: this.addTiddler(sliceTiddler)});
	this.currentTiddler = sliceTiddler.title;
	this.containerStack.push(sliceTiddler.title);
	this.processNodeList(domNode.childNodes);
	this.containerStack.pop();
};

// Output directly to the output tiddlers
Slicer.prototype.outputTiddlers = function() {
	var self = this;
	$tw.utils.each(this.tiddlers,function(tiddlerFields) {
		var title = tiddlerFields.title;
		if(title) {
			$tw.wiki.addTiddler(new $tw.Tiddler(self.wiki.getCreationFields(),tiddlerFields,self.wiki.getModificationFields()));
		}
	});
};

exports.Slicer = Slicer;

})();
