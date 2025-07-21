/*\
title: $:/plugins/tiddlywiki/dynannotate/selection-tracker.js
type: application/javascript
module-type: library

Background daemon to track the selection

\*/

"use strict";

function SelectionTracker(wiki,options) {
	options = options || {};
	const self = this;
	this.wiki = wiki;
	let timerId = null;
	document.addEventListener("selectionchange",(event) => {
		if(timerId) {
			clearTimeout(timerId);
		}
		timerId = setTimeout(() => {
			timerId = null;
			self.handleSelectionChange();
		},500);
	});
}

SelectionTracker.prototype.handleSelectionChange = function() {
	const selection = document.getSelection();
	if(selection && selection.type === "Range") {
		// Helper to get the tiddler title corresponding to a chunk container
		const getIdOfContainer = function(domNode) {
			return domNode.id;
		};
		// Get information about the selection anchor and focus
		const getSelectionInfo = function(targetDomNode,targetOffset) {
			// Find the chunk container node
			let domNode = targetDomNode;
			if(domNode.nodeType === Node.TEXT_NODE) {
				domNode = domNode.parentNode;
			}
			const container = domNode.closest(".dynannotate-chunk");
			if(!container) {
				return null;
			}
			// Find the index of the container within the child nodes of its parent
			const childNodeIndex = Array.prototype.indexOf.call(container.parentNode.childNodes,container);
			// Walk through the chunk collecting the text before and after the specified domNode and offset
			let beforeText = null; let afterText = [];
			const splitTextResult = function() {
				beforeText = afterText;
				afterText = [];
			};
			const processNode = function(domNode) {
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
					$tw.utils.each(domNode.childNodes,(childNode,childNodeIndex) => {
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
				container,
				childNodeIndex,
				beforeText: beforeText.join(""),
				afterText: afterText.join("")
			};

		};
		let anchor = getSelectionInfo(selection.anchorNode,selection.anchorOffset);
		let focus = getSelectionInfo(selection.focusNode,selection.focusOffset);
		// Check that the containers share a parent
		if(anchor && focus && anchor.container.parentNode === focus.container.parentNode) {
			// Make sure that the anchor is before the focus
			if((anchor.childNodeIndex > focus.childNodeIndex) || (anchor.container === focus.container && anchor.beforeText.length > focus.beforeText.length)) {
				const temp = anchor;
				anchor = focus;
				focus = temp;
			}
			const chunks = [];
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
				let domNode;
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
			const actionsTiddler = anchor.container.parentNode.getAttribute("data-selection-actions-title");
			// Assemble the variables to be passed to the action
			const variables = {};
			// Get the bounds of the container and the selection
			const selectionRectangle = selection.getRangeAt(0).getBoundingClientRect();
			const offsetParentRectangle = anchor.container.offsetParent.getBoundingClientRect();
			variables["tv-selection-posx"] = (selectionRectangle.left - offsetParentRectangle.left).toString();
			variables["tv-selection-posy"] = (selectionRectangle.top - offsetParentRectangle.top).toString();
			variables["tv-selection-width"] = (selectionRectangle.width).toString();
			variables["tv-selection-height"] = (selectionRectangle.height).toString();
			variables["tv-selection-coords"] = `(${variables["tv-selection-posx"]},${variables["tv-selection-posy"]},${variables["tv-selection-width"]},${variables["tv-selection-height"]})`;
			// Collect the attributes from the container
			$tw.utils.each(anchor.container.parentNode.attributes,(attribute) => {
				variables[`dom-${attribute.name}`] = attribute.value.toString();
			});
			// Action the selection
			this.performSelectionActions(chunks,variables,actionsTiddler);
		}
	}
};

SelectionTracker.prototype.performSelectionActions = function(chunks,variables,actionsTiddler) {
	// Invoke the actions, passing the extract tiddler title as a variable
	if(actionsTiddler) {
		const actions = $tw.wiki.getTiddlerText(actionsTiddler);
		if(actions) {
			const selection = JSON.stringify({chunks,variables});
			$tw.rootWidget.invokeActionString(actions,undefined,undefined,$tw.utils.extend({},variables,{selection}));
		}
	}
};

exports.SelectionTracker = SelectionTracker;
