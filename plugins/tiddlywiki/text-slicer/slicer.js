/*\
title: $:/plugins/tiddlywiki/text-slicer/slicer.js
type: application/javascript
module-type: startup

Setup the root widget event handlers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "slicer";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

var SLICER_OUTPUT_TITLE = "$:/TextSlicer";

// Install the root widget event handlers
exports.startup = function() {
	$tw.rootWidget.addEventListener("tm-slice-tiddler",function(event) {
		var slicer = new Slicer($tw.wiki,event.param);
		slicer.sliceTiddler(event.param)
		slicer.outputTiddlers(event.param);
		slicer.destroy();
	});
};

function Slicer(wiki,sourceTitle) {
	this.wiki = wiki;
	this.sourceTitle = sourceTitle;
	this.currentId = 0;
	this.iframe = null; // Reference to iframe used for HTML parsing
	this.stopWordList = "the and a of on i".split(" ");
	this.tiddlers = {};
	this.parentStack = [];
	this.sliceTitle = null;
}

Slicer.prototype.destroy = function() {
	// Remove the iframe from the DOM
	if(this.iframe && this.iframe.parentNode) {
		this.iframe.parentNode.removeChild(this.iframe);
	}
};

Slicer.prototype.nextId = function() {
	return ++this.currentId;
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


Slicer.prototype.convertTypeToLevel = function(type) {
	if(type.charAt(0) === "h") {
		return parseInt(type.charAt(1),10);			
	} else {
		return null;
	}
};

Slicer.prototype.isBlank = function(s) {
	return (/^[\s\xA0]*$/mg).test(s);
};

Slicer.prototype.getSourceHtmlDocument = function(tiddler) {
	this.iframe = document.createElement("iframe");
	document.body.appendChild(this.iframe);
	this.iframe.contentWindow.document.open();
	this.iframe.contentWindow.document.write(tiddler.fields.text);
	this.iframe.contentWindow.document.close();
	return this.iframe.contentWindow.document;
};

Slicer.prototype.getSourceWikiDocument = function(tiddler) {
	var widgetNode = this.wiki.makeTranscludeWidget(this.sourceTitle,{document: $tw.fakeDocument, parseAsInline: false}),
		container = $tw.fakeDocument.createElement("div");
	widgetNode.render(container,null);
	return container;
};

Slicer.prototype.getSourceDocument = function() {
	var tiddler = $tw.wiki.getTiddler(this.sourceTitle);
	if(tiddler.fields.type === "text/html") {
		return this.getSourceHtmlDocument(tiddler);
	} else {
		return this.getSourceWikiDocument(tiddler);
	}
};

Slicer.prototype.makeParagraphTitle = function(text) {
	// Remove characters other than lowercase alphanumeric and spaces
	var self = this,
		cleanText = text.toLowerCase().replace(/[^\s\xA0]/mg,function($0,$1,$2) {
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
	// Check for duplicates
	var baseTitle = "para" + s;
	c = 0;
	var title = baseTitle;
	while(this.tiddlers[title] || this.wiki.tiddlerExists(title) || this.wiki.isShadowTiddler(title) || this.wiki.findDraft(title)) {
		title = baseTitle + " " + (++c);
	}
	return title;
};

Slicer.prototype.processNodeList = function(domNodeList) {
	$tw.utils.each(domNodeList,this.processNode.bind(this));
}

Slicer.prototype.processNode = function(domNode) {
	var parentTitle, tags,
		text = domNode.textContent,
		nodeType = domNode.nodeType;
	if(nodeType === 1) {
		var tagName = domNode.tagName.toLowerCase();
		if(tagName === "h1" || tagName === "h2" || tagName === "h3" || tagName === "h4") {
			if(!this.isBlank(text)) {
				parentTitle = this.popParentStackUntil(tagName);
				tags = [parentTitle];
				if(domNode.className.trim() !== "") {
					tags = tags.concat(domNode.className.split(" "));
				}
				this.addToList(parentTitle,text);
				this.parentStack.push({type: tagName, title: this.addTiddler({
					title: text,
					text: "<<display-heading-tiddler level:'" + tagName + "'>>",
					list: [],
					tags: tags
				})});
			}
		} else if(tagName === "ul" || tagName === "ol") {
			var listTitle = this.sliceTitle + "-list-" + this.nextId();
			parentTitle = this.parentStack[this.parentStack.length - 1].title;
			tags = [parentTitle];
			if(domNode.className.trim() !== "") {
				tags = tags.concat(domNode.className.split(" "));
			}
			this.addToList(parentTitle,listTitle);
			this.parentStack.push({type: tagName, title: this.addTiddler({
				title: listTitle,
				text: "<<display-list-tiddler type:'" + tagName + "'>>",
				list: [],
				tags: tags
			})});
			this.processNodeList(domNode.childNodes);
			this.parentStack.pop();
		} else if(tagName === "li") {
			if(!this.isBlank(text)) {
				var listItemTitle = this.sliceTitle + "-listitem-" + this.nextId();
				parentTitle = this.parentStack[this.parentStack.length - 1].title;
				tags = [parentTitle];
				if(domNode.className.trim() !== "") {
					tags = tags.concat(domNode.className.split(" "));
				}
				this.addToList(parentTitle,listItemTitle);
				this.addTiddler({
					title: listItemTitle,
					text: text,
					list: [],
					tags: tags
				});
			}
		} else if(tagName === "p") {
			if(!this.isBlank(text)) {
				parentTitle = this.parentStack[this.parentStack.length - 1].title;
				tags = [parentTitle];
				if(domNode.className.trim() !== "") {
					tags = tags.concat(domNode.className.split(" "));
				}
				this.addToList(parentTitle,this.addTiddler({
					title: this.makeParagraphTitle(text),
					text: text,
					tags: tags
				}));
			}
		} else if(domNode.hasChildNodes()) {
			this.processNodeList(domNode.childNodes);
		}
	}
};

// Slice a tiddler into individual tiddlers
Slicer.prototype.sliceTiddler = function(title) {
	this.sliceTitle = title;
	var domNode = this.getSourceDocument();
	this.parentStack.push({type: "h0", title: this.addTiddler({
		title: "Sliced up " + title,
		text: "{{||$:/plugins/tiddlywiki/text-slicer/templates/display-document}}",
		list: []
	})});
	this.processNodeList(domNode.childNodes);
};

// Output directly to the output tiddlers
Slicer.prototype.outputTiddlers = function(navigateFromTitle) {
	$tw.utils.each(this.tiddlers,function(tiddlerFields) {
		var title = tiddlerFields.title;
		if(title) {
			$tw.wiki.addTiddler(new $tw.Tiddler($tw.wiki.getCreationFields(),tiddlerFields,$tw.wiki.getModificationFields()));
		}
	});
	// Navigate to output
	var story = new $tw.Story({wiki: $tw.wiki});
	story.navigateTiddler("Sliced up " + this.sliceTitle,navigateFromTitle);
};

// Output via an import tiddler
Slicer.prototype.outputTiddlers_viaImportTiddler = function(tiddlers,navigateFromTitle) {
	// Get the current slicer output tiddler
	var slicerOutputTiddler = $tw.wiki.getTiddler(SLICER_OUTPUT_TITLE),
		slicerOutputData = $tw.wiki.getTiddlerData(SLICER_OUTPUT_TITLE,{}),
		newFields = new Object({
			title: SLICER_OUTPUT_TITLE,
			type: "application/json",
			"plugin-type": "import",
			"status": "pending"
		});
	// Process each tiddler
	slicerOutputData.tiddlers = slicerOutputData.tiddlers || {};
	$tw.utils.each(tiddlers,function(tiddlerFields) {
		var title = tiddlerFields.title;
		if(title) {
			slicerOutputData.tiddlers[title] = tiddlerFields;
		}
	});
	// Save the slicer output tiddler
	newFields.text = JSON.stringify(slicerOutputData,null,$tw.config.preferences.jsonSpaces);
	$tw.wiki.addTiddler(new $tw.Tiddler(slicerOutputTiddler,newFields));
	// Navigate to output
	var story = new $tw.Story({wiki: $tw.wiki});
	story.navigateTiddler(SLICER_OUTPUT_TITLE,navigateFromTitle);
};

})();
