/*\
title: $:/plugins/tiddlywiki/text-slicer/modules/slicer.js
type: application/javascript
module-type: library

Slice a tiddler or DOM document into individual tiddlers

var slicer = new textSlicer.Slicer(doc,{
		sourceTiddlerTitle: tiddler to slice -or-
		sourceText: text to slice -or-
		sourceDoc: DOM document to
		baseTiddlerTitle: "MySlicedTiddlers-",
		role: "sliced-content"
	});

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var DOMParser = $tw.browser ? window.DOMParser : require("$:/plugins/tiddlywiki/xmldom/dom-parser").DOMParser;

function Slicer(options) {
	// Marshal parameters
	this.sourceDoc = options.sourceDoc;
	this.sourceTiddlerTitle = options.sourceTiddlerTitle;
	this.sourceText = options.sourceText;
	this.wiki = options.wiki;
	if(options.baseTiddlerTitle) {
		this.baseTiddlerTitle = options.baseTiddlerTitle		
	} else {
		if(this.sourceTiddlerTitle) {
			this.baseTiddlerTitle = "Sliced up " + this.sourceTiddlerTitle;
		} else {
			this.baseTiddlerTitle = "SlicedTiddler";
		}
	}
	this.role = options.role || "sliced-html";
	// Initialise state
	this.extractedTiddlers = {}; // Hashmap of created tiddlers
	this.parentStack = []; // Stack of parent heading or list
	this.containerStack = []; // Stack of elements containing other elements
	this.slicers = $tw.modules.applyMethods("slicer");
	this.anchors = Object.create(null); // Hashmap of HTML anchor ID to tiddler title
	// Get the DOM document for the source text
	if(!this.sourceDoc) {
		if(this.sourceTiddlerTitle) {
			this.sourceDoc = this.parseTiddlerText(this.sourceTiddlerTitle);
		} else {
			this.sourceDoc = this.parseHtmlText(this.sourceText);
		}
	}
	// Create parent tiddler
console.log("Slicing to",this.baseTiddlerTitle)
	var sliceTiddler = {
		title: this.baseTiddlerTitle,
		text: "Sliced at " + (new Date()),
		"toc-type": "document",
		tags: [],
		list: [],
		role: this.role
	};
	this.addTiddler(sliceTiddler);
	// Slice the text into subordinate tiddlers
	this.parentStack.push({type: "h0", title: sliceTiddler.title});
	this.currentTiddler = sliceTiddler.title;
	this.containerStack.push(sliceTiddler.title);
	this.processNodeList(this.sourceDoc.childNodes);
	this.containerStack.pop();
}

Slicer.prototype.parseTiddlerText = function(title) {
	var tiddler = this.wiki.getTiddler(title);
	if(tiddler) {
		if(tiddler.fields.type === "text/html") {
			return this.parseHtmlText(tiddler.fields.text);
		} else {
			return this.parseWikiText(tiddler);
		}
	}
};

Slicer.prototype.parseWikiText = function(tiddler) {
	var widgetNode = this.wiki.makeTranscludeWidget(tiddler.fields.title,{
			document: $tw.fakeDocument,
			parseAsInline: false,
			importPageMacros: true}),
		container = $tw.fakeDocument.createElement("div");
	widgetNode.render(container,null);
	return container;
};

Slicer.prototype.parseHtmlText = function(text) {
	text = text || "";
	if($tw.browser) {
		this.iframe = document.createElement("iframe");
		document.body.appendChild(this.iframe);
		this.iframe.contentWindow.document.open();
		this.iframe.contentWindow.document.write(text);
		this.iframe.contentWindow.document.close();
		return this.iframe.contentWindow.document;
	} else {
		return new DOMParser().parseFromString(text);
	}
};

Slicer.prototype.addToList = function(parent,child) {
	var parentTiddler = this.getTiddler(parent) || {},
		parentList = parentTiddler.list || [];
	parentList.push(child);
	this.addTiddler($tw.utils.extend({title: parent},parentTiddler,{list: parentList}));
};

Slicer.prototype.insertBeforeListItem = function(parent,child,beforeSibling) {
	var parentTiddler = this.getTiddler(parent) || {},
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
		var tiddler = this.getTiddler(title) || {},
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

Slicer.prototype.makeUniqueTitle = function(rawText) {
	// Remove characters other than lowercase alphanumeric and spaces
	var prefix = this.baseTiddlerTitle,
		self = this,
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
			return word && ("the and a of on i".split(" ").indexOf(word) === -1);
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
	while(this.getTiddler(title)) {
		title = baseTitle + "-" + (++c);
	}
	return title;
};

Slicer.prototype.addTiddler = function(fields) {
	if(fields.title) {
		this.extractedTiddlers[fields.title] = Object.assign({},fields);
	}
	return fields.title;
};

Slicer.prototype.addTiddlers = function(fieldsArray) {
	var self = this;
	(fieldsArray || []).forEach(function(fields) {
		self.addTiddler(fields);
	});
};

Slicer.prototype.getTiddler = function(title) {
	return this.extractedTiddlers[title];
};

Slicer.prototype.getTiddlers = function() {
	var self = this;
	return Object.keys(this.extractedTiddlers).map(function(title) {
		return self.extractedTiddlers[title]
	})
};

exports.Slicer = Slicer;

})();
