/*\
title: $:/plugins/tiddlywiki/dynannotate/selection-tracker.js
type: application/javascript
module-type: library

Background daemon to track the selection

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function SelectionTracker(wiki,options) {
	options = options || {};
	var self = this;
	this.wiki = wiki;
	var timerId = null;
	document.addEventListener("selectionchange",function(event) {
		if(timerId) {
			clearTimeout(timerId);
		}
		timerId = setTimeout(function() {
			timerId = null;
			self.handleSelectionChange();
		},500);
	});
}

SelectionTracker.prototype.handleSelectionChange = function() {
	var selection = document.getSelection();
	if(selection && selection.type === "Range") {
		// Helper to get the tiddler title corresponding to a chunk container
		var getIdOfContainer = function(domNode) {
			return domNode.id;
		}
		// Get information about the selection anchor and focus
		var getSelectionInfo = function(targetDomNode,targetOffset) {
			// Find the chunk container node
			var domNode = targetDomNode;
			if(domNode.nodeType === Node.TEXT_NODE) {
				domNode = domNode.parentNode;
			}
			var container = domNode.closest(".dynannotate-chunk");
			if(!container) {
				return null;
			}
			// Find the index of the container within the child nodes of its parent
			var childNodeIndex = Array.prototype.indexOf.call(container.parentNode.childNodes,container);
			// Walk through the chunk collecting the text before and after the specified domNode and offset
			var beforeText = null, afterText = [];
			var splitTextResult = function() {
					beforeText = afterText;
					afterText = [];
				},
				processNode = function(domNode) {
					// Check for a text node
					if(domNode.nodeType === Node.TEXT_NODE) {
						// If this is the target node then perform the split
						if(domNode === targetDomNode) {
							afterText.push(domNode.textContent.substring(0,targetOffset));
							splitTextResult();
							afterText.push(domNode.textContent.substring(targetOffset));
						} else {
							afterText.push(domNode.textContent);
						}
					} else {
						// Process the child nodes
						$tw.utils.each(domNode.childNodes,function(childNode,childNodeIndex) {
							// Check whether we need to split on this child node
							if(domNode === targetDomNode && childNodeIndex === targetOffset) {
								splitTextResult();
							}
							processNode(childNode);
						});
					}
				};
			processNode(container);
			if(beforeText === null) {
				splitTextResult();
			}
			// Return results
			return {
				container: container,
				childNodeIndex: childNodeIndex,
				beforeText: beforeText.join(""),
				afterText: afterText.join("")
			}

		}
		var anchor = getSelectionInfo(selection.anchorNode,selection.anchorOffset),
			focus = getSelectionInfo(selection.focusNode,selection.focusOffset);
		// Check that the containers share a parent
		if(anchor && focus && anchor.container.parentNode === focus.container.parentNode) {
			// Make sure that the anchor is before the focus
			if((anchor.childNodeIndex > focus.childNodeIndex) || (anchor.container === focus.container && anchor.beforeText.length > focus.beforeText.length)) {
				var temp = anchor; 
				anchor = focus; 
				focus = temp;
			}
			var chunks = [];
			// Check for the selection being all in one chunk
			if(anchor.container === focus.container) {
				chunks.push({
					id: getIdOfContainer(anchor.container),
					prefix: anchor.beforeText,
					text: anchor.afterText.substring(0,anchor.afterText.length - focus.afterText.length),
					suffix: focus.afterText
				});
			} else {
				// We span two or more chunks
				chunks.push({
					id: getIdOfContainer(anchor.container),
					prefix: anchor.beforeText,
					text: anchor.afterText
				});
				// Get the titles and text of the intervening tiddlers
				var domNode;
				if(anchor.container !== focus.container) {
					domNode = anchor.container.nextElementSibling;
					while(domNode && domNode !== focus.container) {
						chunks.push({
							id: getIdOfContainer(domNode),
							text: domNode.textContent
						});
						domNode = domNode.nextElementSibling;
					}					
				}
				chunks.push({
					id: getIdOfContainer(focus.container),
					text: focus.beforeText,
					suffix: focus.afterText
				});
			}
			// Get the title of the tiddler containing the actions to be executed
			var actionsTiddler = anchor.container.parentNode.getAttribute("data-selection-actions-title");
			// Assemble the variables to be passed to the action
			var variables = {};
			// Get the bounds of the container and the selection
			var selectionRectangle = selection.getRangeAt(0).getBoundingClientRect(),
				offsetParentRectangle = anchor.container.offsetParent.getBoundingClientRect();
			variables["tv-selection-posx"] = (selectionRectangle.left - offsetParentRectangle.left).toString();
			variables["tv-selection-posy"] = (selectionRectangle.top - offsetParentRectangle.top).toString();
			variables["tv-selection-width"] = (selectionRectangle.width).toString();
			variables["tv-selection-height"] = (selectionRectangle.height).toString();
			variables["tv-selection-coords"] = "(" + variables["tv-selection-posx"] + "," + variables["tv-selection-posy"] + "," + variables["tv-selection-width"] + "," + variables["tv-selection-height"] + ")";
			// Collect the attributes from the container
			$tw.utils.each(anchor.container.parentNode.attributes,function(attribute) {
				variables["dom-" + attribute.name] = attribute.value.toString();
			});
			// Action the selection
			this.performSelectionActions(chunks,variables,actionsTiddler);
		}
	}
};

SelectionTracker.prototype.performSelectionActions = function(chunks,variables,actionsTiddler) {
	// Invoke the actions, passing the extract tiddler title as a variable
	if(actionsTiddler) {
		var actions = $tw.wiki.getTiddlerText(actionsTiddler)
		if(actions) {
			var selection = JSON.stringify({chunks: chunks,variables: variables});
			$tw.rootWidget.invokeActionString(actions,undefined,undefined,$tw.utils.extend({},variables,{selection: selection}));
		}
	}
};

exports.SelectionTracker = SelectionTracker;

})();
