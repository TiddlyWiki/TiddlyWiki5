/*\
title: $:/plugins/tiddlywiki/dynannotate/legacy-selection-tracker.js
type: application/javascript
module-type: library

Legacy version of the dyannotate background daemon to track the selection

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var TextMap = require("$:/plugins/tiddlywiki/dynannotate/textmap.js").TextMap;

function LegacySelectionTracker(wiki,options) {
	options = options || {};
	var self = this;
	this.wiki = wiki;
	this.allowBlankSelectionPopup = options.allowBlankSelectionPopup;
	this.selectionPopupTitle = null;
	document.addEventListener("selectionchange",function(event) {
		var selection = document.getSelection();
		if(selection && (selection.type === "Range" || (self.allowBlankSelectionPopup && !self.selectionPopupTitle))) {
			// Look for the selection containers for each of the two ends of the selection
			var anchorContainer = self.findSelectionContainer(selection.anchorNode),
				focusContainer = self.findSelectionContainer(selection.focusNode);
			// If either end of the selection then we ignore it
			if(!!anchorContainer || !!focusContainer) {
				var selectionRange = selection.getRangeAt(0);
				// Check for the selection spilling outside the starting container
				if((anchorContainer !== focusContainer) || (selectionRange.startContainer.nodeType !== Node.TEXT_NODE && selectionRange.endContainer.nodeType !== Node.TEXT_NODE)) {
					if(self.selectionPopupTitle) {
						self.wiki.deleteTiddler(self.selectionPopupTitle);
						self.selectionPopupTitle = null;
					}
				} else {
					self.selectionSaveTitle = anchorContainer.getAttribute("data-annotation-selection-save");
					self.selectionPrefixSaveTitle = anchorContainer.getAttribute("data-annotation-selection-prefix-save");
					self.selectionSuffixSaveTitle = anchorContainer.getAttribute("data-annotation-selection-suffix-save");
					self.selectionPopupTitle = anchorContainer.getAttribute("data-annotation-selection-popup");
					// The selection is a range so we trigger the popup
					if(self.selectionPopupTitle) {
						var selectionRectangle = selectionRange.getBoundingClientRect(),
							trackingRectangle = anchorContainer.getBoundingClientRect();
						$tw.popup.triggerPopup({
							domNode: null,
							domNodeRect: {
								left: selectionRectangle.left - trackingRectangle.left,
								top: selectionRectangle.top - trackingRectangle.top,
								width: selectionRectangle.width,
								height: selectionRectangle.height
							},
							force: true,
							floating: true,
							title: self.selectionPopupTitle,
							wiki: self.wiki
						});						
					}
					// Write the selection text to the specified tiddler
					if(self.selectionSaveTitle) {
						// Note that selection.toString() normalizes whitespace but selection.getRangeAt(0).toString() does not
						var text = selectionRange.toString();
						self.wiki.addTiddler(new $tw.Tiddler({title: self.selectionSaveTitle, text: text}));
						// Build a textmap of the container so that we can find the prefix and suffix
						var textMap = new TextMap(anchorContainer);
						// Find the selection start in the text map and hence extract the prefix and suffix
						var context = textMap.extractContext(selectionRange.startContainer,selectionRange.startOffset,text);
						// Save the prefix and suffix
						if(context) {
							if(self.selectionPrefixSaveTitle) {
								self.wiki.addTiddler(new $tw.Tiddler({title: self.selectionPrefixSaveTitle, text: context.prefix}));
							}
							if(self.selectionSuffixSaveTitle) {
								self.wiki.addTiddler(new $tw.Tiddler({title: self.selectionSuffixSaveTitle, text: context.suffix}));
							}
						}
					}
				}
			}
		} else {
			// If the selection is a caret we clear any active popup
			if(self.selectionPopupTitle) {
				self.wiki.deleteTiddler(self.selectionPopupTitle);
				self.selectionPopupTitle = null;
			}
		}
	});
}

LegacySelectionTracker.prototype.findSelectionContainer = function findSelectionContainer(domNode) {
	if(domNode && domNode.nodeType === Node.ELEMENT_NODE && domNode.classList.contains("tc-dynannotation-selection-container")) {
		return domNode;
	}
	if(domNode && domNode.parentNode) {
		return findSelectionContainer(domNode.parentNode);
	}
	return null;
};

exports.LegacySelectionTracker = LegacySelectionTracker;

})();
