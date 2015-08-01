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
		// Slice up and output the tiddler
		outputTiddlers(sliceTiddler(event.param));
	});
};

var currentId = 0;

function nextId() {
	return ++currentId;
}

// Slice a tiddler into individual tiddlers
function sliceTiddler(title) {
	var tiddlers = {},
		parser = $tw.wiki.parseTiddler(title),
		parentStack = [],
		addTiddler = function(fields) {
			if(fields.title) {
				tiddlers[fields.title] = $tw.utils.extend({},tiddlers[fields.title],fields);
				return fields.title;
			} else {
				return null;
			}
		},
		addToList = function(parent,child) {
			var parentTiddler = tiddlers[parent] || {},
				parentList = parentTiddler.list || [];
			parentList.push(child);
			addTiddler($tw.utils.extend({title: parent},parentTiddler,{list: parentList}));
		},
		convertTypeToLevel = function(type) {
			if(type.charAt(0) === "h") {
				return parseInt(type.charAt(1),10);			
			} else {
				return null;
			}
		},
		popParentStackUntil = function(type) {
			// Pop the stack to remove any entries at the same or lower level
			var newLevel = convertTypeToLevel(type),
				topIndex = parentStack.length - 1;
			do {
				var topLevel = convertTypeToLevel(parentStack[parentStack.length - 1].type);
				if(topLevel !== null && topLevel < newLevel ) {
					break;
				}
				parentStack.length--;
			} while(true);
			return parentStack[parentStack.length - 1].title;
		},
		processNodeList = function(nodeList) {
			$tw.utils.each(nodeList,function(parseTreeNode) {
				var parentTitle,
					text = $tw.utils.getParseTreeText(parseTreeNode);
				if(parseTreeNode.type === "element" && (parseTreeNode.tag === "h1" || parseTreeNode.tag === "h2" || parseTreeNode.tag === "h3" || parseTreeNode.tag === "h4")) {
					parentTitle = popParentStackUntil(parseTreeNode.tag);
					addToList(parentTitle,text);
					parentStack.push({type: parseTreeNode.tag, title: addTiddler({
						title: text,
						text: "<<display-heading-tiddler level:'" + parseTreeNode.tag + "'>>",
						list: [],
						tags: [parentTitle]
					})});
				} else if(parseTreeNode.type === "element" && (parseTreeNode.tag === "ul" || parseTreeNode.tag === "ol")) {
					var listTitle = title + "-list-" + nextId();
					parentTitle = parentStack[parentStack.length - 1].title;
					addToList(parentTitle,listTitle);
					parentStack.push({type: parseTreeNode.tag, title: addTiddler({
						title: listTitle,
						text: "<<display-list-tiddler type:'" + parseTreeNode.tag + "'>>",
						list: [],
						tags: [parentTitle]
					})});
					processNodeList(parseTreeNode.children);
					parentStack.pop();
				} else if(parseTreeNode.type === "element" && parseTreeNode.tag === "li") {
					var listItemTitle = title + "-listitem-" + nextId();
					parentTitle = parentStack[parentStack.length - 1].title;
					addToList(parentTitle,listItemTitle);
					addTiddler({
						title: listItemTitle,
						text: text,
						list: [],
						tags: [parentTitle]
					});
				} else if(parseTreeNode.type === "element" && parseTreeNode.tag === "p") {
					parentTitle = parentStack[parentStack.length - 1].title;
					addToList(parentTitle,addTiddler({
						title: title + "-para-" + nextId(),
						text: text,
						tags: [parentTitle]
					}));
				}
			});
		};
	if(parser) {
		parentStack.push({type: "h0", title: addTiddler({
			title: "Sliced up " + title,
			text: "<div class='tc-table-of-contents'>\n\n<<toc-selective-expandable 'Sliced up " + title + "'>>\n\n</div>\n<<display-heading-tiddler level:'h1'>>",
			list: []
		})});
		processNodeList(parser.tree);
	}
	return tiddlers;
}

// Output to the output tiddler
function outputTiddlers(tiddlers) {
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
	// TBD: Navigate to $:/Import
}

})();
