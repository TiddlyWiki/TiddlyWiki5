/*\
title: $:/plugins/tiddlywiki/text-slicer/modules/slicer.js
type: application/javascript
module-type: library

Slice a tiddler or DOM document into individual tiddlers

var slicer = new textSlicer.Slicer(doc,{
		slicerRules: JSON data defining slicer rules -or- title of rules taken from tiddlers tagged $:/tags/text-slicer/slicer-rules
		sourceTiddlerTitle: tiddler to slice -or-
		sourceText: text to slice
		outputMode: "html" (default) -or- "wiki"
		baseTiddlerTitle: "MySlicedTiddlers-"
		role: "sliced-content"
		callback: function(err,tiddlers)
	});

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function Slicer(options) {
	// Quick tests
	this.testSlicerRuleMatching();
	// Marshal parameters
	this.sourceTiddlerTitle = options.sourceTiddlerTitle;
	this.sourceText = options.sourceText;
	this.wiki = options.wiki;
	this.role = options.role || "sliced-html";
	this.outputMode = options.outputMode || "html";
	this.escapeWikiText = options.escapeWikiText || false;
	this.callbackFn = options.callback;
	// Get the slicer rules
	var nameSlicerRules = null;
	if(!options.slicerRules) {
		nameSlicerRules = "html-by-paragraph";
		this.slicerRules = this.loadSlicerRules(nameSlicerRules);
	} else if(typeof options.slicerRules === "string") {
		nameSlicerRules = options.slicerRules;
		this.slicerRules = this.loadSlicerRules(nameSlicerRules);
	} else {
		this.slicerRules = options.slicerRules;
	}
	// Set up the base tiddler title
	this.baseTiddlerTitle = this.getBaseTiddlerTitle(options.baseTiddlerTitle);
	// Initialise state
	this.namespaces = {}; // Hashmap of URLs
	this.chunks = []; // Array of tiddlers without titles, addressed by their index. We use the title field to hold the plain text content
	this.currentChunk = null; // Index of the chunk currently being written to
	this.parentStack = []; // Stack of parent chunks {chunk: chunk index,actions:}
	this.elementStack = []; // Stack of {tag:,isSelfClosing:,actions:} 
	// Set up the document tiddler as top level heading
	this.chunks.push({
		"toc-type": "document",
		title: "", // makeUniqueTitle will later initialise it to baseTiddlerTitle
		text: "<div class='tc-table-of-contents'><<toc-selective-expandable \"\"\"" + this.baseTiddlerTitle + "document\"\"\">></div>",
		list: [],
		tags: [],
		role: this.role,
		"slicer-rules": nameSlicerRules,
		"slicer-output-mode": this.outputMode
	});
	this.parentStack.push({chunk: 0, actions: this.getMatchingSlicerRuleActions("(document)")});
	// Set up the parser
	var sax = require("$:/plugins/tiddlywiki/sax/sax.js");
	this.sax = sax.parser(false,{
		xmlns: true,
		lowercase: true
	});
	this.sax.onerror = this.onError.bind(this);
	this.sax.onopennamespace = this.onOpenNamespace.bind(this);
	this.sax.onclosenamespace = this.onCloseNamespace.bind(this);
	this.sax.onopentag = this.onOpenTag.bind(this);
	this.sax.onclosetag = this.onCloseTag.bind(this);
	this.sax.ontext = this.onText.bind(this);
	this.sax.onend = this.onEnd.bind(this);
	// Start streaming the data
	this.sax.write(this.getSourceText());
	this.sax.close();
}

Slicer.prototype.callback = function(err,tiddlers) {
	var self = this;
	$tw.utils.nextTick(function() {
		self.callbackFn(err,tiddlers);
	});
};

Slicer.prototype.loadSlicerRules = function(name) {
	// Collect the available slicer rule tiddlers
	var self = this,
		titles = this.wiki.getTiddlersWithTag("$:/tags/text-slicer/slicer-rules"),
		tiddlers = {},
		rules = {},
		ruleNames = [];
	titles.forEach(function(title) {
		var tiddler = self.wiki.getTiddler(title);
		tiddlers[tiddler.fields.name] = tiddler;
		rules[tiddler.fields.name] = self.wiki.getTiddlerData(title,[]);
	});
	// Follow the inheritance trail to get a stack of slicer rule names
	var n = name;
	do {
		ruleNames.push(n);
		n = tiddlers[n] && tiddlers[n].fields["inherits-from"];
	} while(n && ruleNames.indexOf(n) === -1);
	// Concatenate the slicer rules
	rules = ruleNames.reduce(function(accumulator,name) {
		return accumulator.concat(rules[name]);
	},[]);
	return rules;
};

Slicer.prototype.getMatchingSlicerRuleActions = function(name) {
	var rule = this.searchSlicerRules(name,this.slicerRules,this.elementStack);
	if(!rule) {
		return {};
	} else {
		return rule.actions;
	}
};

Slicer.prototype.testSlicerRuleMatching = function() {
	var tests = [
			{
				test: this.searchSlicerRules("title",[
						{selector: "title,head,body", rules: true},
						{selector: "body", rules: true}
					],[
						{tag:"head"}
					]),
				result: "title,head,body"
			},
			{
				test: this.searchSlicerRules("body",[
						{selector: "title,head,body", rules: true},
						{selector: "body", rules: true}
					],[
						{tag:"head"}
					]),
				result: "title,head,body"
			},
			{	
				test: this.searchSlicerRules("title",[
						{selector: "head > title", rules: true},
						{selector: "title", rules: true}
					],[
						{tag:"head"}
					]),
				result: "head > title"
			}
		],
		results = tests.forEach(function(test,index) {
			if(test.test.selector !== test.result) {
				throw "Failing test " + index + ", returns " + test.test.selector + " instead of " + test.result;
			}
		});
};

Slicer.prototype.searchSlicerRules = function(name,rules,elementStack) {
	return rules.find(function(rule) {
		// Split and trim the selectors for this rule
		return !!rule.selector.split(",").map(function(selector) {
				return selector.trim();
			// Find the first selector that matches, if any
			}).find(function(selector) {
				// Split and trim the parts of the selector
				var parts = selector.split(" ").map(function(part) {
					return part.trim();
				});
				// * matches any element
				if(parts.length === 1 && parts[0] === "*") {
					return true;
				}
				// Make a copy of the element stack so that we can be destructive
				var elements = elementStack.slice(0).concat({tag: name}),
					nextElementMustBeAtTopOfStack = true,
					currentPart = parts.length - 1;
				while(currentPart >= 0) {
					if(parts[currentPart] === ">") {
						nextElementMustBeAtTopOfStack = true;
					} else {
						if(!nextElementMustBeAtTopOfStack) {
							while(elements.length > 0 && elements[elements.length - 1].tag !== parts[currentPart]) {
								elements.pop();
							}
						}
						if(elements.length === 0 || elements[elements.length - 1].tag !== parts[currentPart]) {
							return false;
						}
						elements.pop();
						nextElementMustBeAtTopOfStack = false;
					}
					currentPart--;
				}
				return true;
			});
		});
};

Slicer.prototype.getBaseTiddlerTitle = function(baseTiddlerTitle) {
	if(baseTiddlerTitle) {
		return baseTiddlerTitle		
	} else {
		if(this.sourceTiddlerTitle) {
			return "Sliced up " + this.sourceTiddlerTitle + ":";
		} else {
			return "SlicedTiddler";
		}
	}
};

Slicer.prototype.getSourceText = function() {
	if(this.sourceTiddlerTitle) {
		var tiddler = this.wiki.getTiddler(this.sourceTiddlerTitle);
		if(!tiddler) {
			console.log("Tiddler '" + this.sourceTiddlerTitle + "' does not exist");
			return "";
		}
		if(tiddler.fields.type === "text/html" || tiddler.fields.type === "text/xml" || (tiddler.fields.type || "").slice(-4) === "+xml") {
			return tiddler.fields.text;
		} else {
			return this.getTiddlerAsHtml(tiddler);
		}
	} else {
		return this.sourceText;
	}
};

Slicer.prototype.getTiddlerAsHtml = function(tiddler) {
	var widgetNode = this.wiki.makeTranscludeWidget(tiddler.fields.title,{
			document: $tw.fakeDocument,
			parseAsInline: false,
			importPageMacros: true}),
		container = $tw.fakeDocument.createElement("div");
	widgetNode.render(container,null);
	return ["<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.1//EN\" \"http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd\">","<html xmlns=\"http://www.w3.org/1999/xhtml\">","<head>","</head>","<body>",container.innerHTML,"</body>","</html>"].join("\n");
};


Slicer.prototype.getImmediateParent = function() {
	return this.parentStack.slice(-1)[0];
};

Slicer.prototype.onError = function(e) {
	console.error("Sax error: ", e)
	// Try to resume after errors
	this.sax.error = null;
	this.sax.resume();
};

Slicer.prototype.onOpenNamespace = function(info) {
	this.namespaces[info.prefix] = info.uri;
};

Slicer.prototype.onCloseNamespace = function(info) {
};

Slicer.prototype.onOpenTag = function(node) {
	var actions = this.getMatchingSlicerRuleActions(node.name);
	// Check for an element that should start a new chunk
	if(actions.startNewChunk) {
		// If this is a heading, pop off any higher or equal level headings first
		if(actions.isParent && actions.headingLevel) {
			var parentActions = this.getImmediateParent().actions;
			while(parentActions.isParent && parentActions.headingLevel && parentActions.headingLevel >= actions.headingLevel) {
				this.parentStack.pop();
				parentActions = this.getImmediateParent().actions;
			}
		}
		// Start the new chunk
		this.startNewChunk(actions.startNewChunk);
		// If this is a parent then also add it to the parent stack
		if(actions.isParent) {
			this.parentStack.push({chunk: this.currentChunk, actions: actions});
		}
	}
	// Render the tag inline in the current chunk unless we should ignore it
	if(!actions.dontRenderTag) {
		if(actions.isImage) {
			this.onImage(node);
		} else {
			var markupInfo = actions.markup && actions.markup[this.outputMode];
			if(markupInfo) {
				this.addTextToCurrentChunk(markupInfo.prefix);
			} else {
				this.addTextToCurrentChunk("<" + node.name + (node.isSelfClosing ? "/" : "") + ">");				
			}
		}
	}
	// Remember whether this tag is self closing
	this.elementStack.push({tag: node.name,isSelfClosing: node.isSelfClosing, actions: actions});
};

Slicer.prototype.onImage = function(node) {
	var url = node.attributes.src.value;
	if(url.slice(0,5) === "data:") {
		// var parts = url.slice(5).split(",");
		// this.chunks.push({
		// 	title: ,
		// 	text: parts[1],
		// 	type: parts[0].split[";"][0],
		// 	role: this.role
		// });
	}
	this.addTextToCurrentChunk("[img[" + $tw.utils.resolvePath(url,this.baseTiddlerTitle) + "]]");
};

Slicer.prototype.onCloseTag = function(name) {
	var e = this.elementStack.pop(),
		actions = e.actions,
		selfClosing = e.isSelfClosing;
	// Set the caption if required
	if(actions.setCaption) {
		this.chunks[this.currentChunk].caption = this.chunks[this.currentChunk].title;
	}
	// Render the tag
	if (!actions.dontRenderTag && !selfClosing) {
		var markupInfo = actions.markup && actions.markup[this.outputMode];
		if(markupInfo) {
			this.addTextToCurrentChunk(markupInfo.suffix);
		} else {
			this.addTextToCurrentChunk("</" + name + ">");			
		}
	}
	// Check for an element that started a new chunk
	if(actions.startNewChunk) {
		if(!actions.mergeNext) {
			this.currentChunk = null;			
		}
		// If this is a parent and not a heading then also pop it from the parent stack
		if(actions.isParent && !actions.headingLevel) {
			this.parentStack.pop();
		}
	}
};

Slicer.prototype.onText = function(text) {
	var self = this;
	// Discard the text if we're inside an element with actions.discard set true
	if(this.elementStack.some(function(e) {return e.actions.discard;})) {
		return;
	}
	// Optionally escape common character sequences that might be parsed as wikitext
	text = $tw.utils.htmlEncode(text);
	if(this.escapeWikiText) {
		$tw.utils.each(["[[","{{","__","''","//",",,","^^","~~","`","--","\"\"","@@"],function(str) {
			var replace = str.split("").map(function(c) {
				return "&#" + c.charCodeAt(0) + ";";
			}).join("");
			text = text.replace(new RegExp($tw.utils.escapeRegExp(str),"mg"),replace);
		});
	}
	this.addTextToCurrentChunk(text);
	this.addTextToCurrentChunk(text,"title");
};

Slicer.prototype.onEnd = function() {
	this.assignTitlesToChunks();
	this.callback(null,this.chunks);
};

Slicer.prototype.addTextToCurrentChunk = function(str,field) {
	field = field || "text";
	if(this.currentChunk === null && str.trim() !== "") {
		this.startNewChunk({
			"toc-type": "paragraph"
		});
	}
	if(this.currentChunk !== null) {
		this.chunks[this.currentChunk][field] += str;
	}
};

Slicer.prototype.startNewChunk = function(fields) {
	var parentIndex = this.getImmediateParent().chunk;
	this.chunks.push($tw.utils.extend({},{
		title: "",
		text: "",
		tags: [parentIndex],
		list: [],
		role: this.role
	},fields));
	this.currentChunk = this.chunks.length - 1;
	this.chunks[parentIndex].list.push(this.currentChunk);
};

Slicer.prototype.isBlank = function(s) {
	return (/^[\s\xA0]*$/g).test(s);
};

Slicer.prototype.assignTitlesToChunks = function() {
	var self = this;
	// Create a title for each tiddler
	var titles = {};
	this.chunks.forEach(function(chunk) {
		var base = chunk["toc-type"] === "document" ? "" : chunk["toc-type"] + "-" + chunk.title,
			title = self.makeUniqueTitle(titles,base);
		titles[title] = true;
		chunk.title = title;
	});
	// Link up any indices in the tags and list fields
	this.chunks.forEach(function(chunk) {
		if(chunk.tags) {
			chunk.tags.map(function(tag,index) {
				if(typeof tag === "number") {
					chunk.tags[index] = self.chunks[tag].title;
				}
			});
		}
		if(chunk.list) {
			chunk.list.map(function(listItem,index) {
				if(typeof listItem === "number") {
					chunk.list[index] = self.chunks[listItem].title;
				}
			});
		}
	});
};

Slicer.prototype.makeUniqueTitle = function(tiddlers,rawText) {
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
			s += (s === "" ? "" : "-") + words[c++];
		}
		prefix = prefix + s;
	}
	// Check for duplicates
	c = 0;
	var title = prefix;
	while(title in tiddlers) {
		title = prefix + "-" + (++c);
	}
	return title;
};

exports.Slicer = Slicer;

})();
