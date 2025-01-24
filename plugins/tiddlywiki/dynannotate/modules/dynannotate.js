/*\
title: $:/plugins/tiddlywiki/dynannotate/dynannotate.js
type: application/javascript
module-type: widget

Dynannotate widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var TextMap = require("$:/plugins/tiddlywiki/dynannotate/textmap.js").TextMap;

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var Popup = require("$:/core/modules/utils/dom/popup.js");

var DynannotateWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
DynannotateWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
DynannotateWidget.prototype.render = function(parent,nextSibling) {
	var self = this;
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	// Create our DOM nodes
	var isSnippetMode = this.isSnippetMode();
	this.domContent = $tw.utils.domMaker("div",{
		"class": "tc-dynannotation-selection-container",
		document: this.document
	});
	if(isSnippetMode) {
		this.domContent.setAttribute("hidden","hidden");
	}
	this.domAnnotations = $tw.utils.domMaker("div",{
		"class": "tc-dynannotation-annotation-wrapper",
		document: this.document
	});
	this.domSnippets = $tw.utils.domMaker("div",{
		"class": "tc-dynannotation-snippet-wrapper",
		document: this.document
	});
	this.domSearches = $tw.utils.domMaker("div",{
		"class": "tc-dynannotation-search-wrapper",
		document: this.document
	});
	this.domWrapper = $tw.utils.domMaker("div",{
		"class": "tc-dynannotation-wrapper",
		children: [this.domContent,this.domAnnotations,this.domSnippets,this.domSearches],
		document: this.document
	})
	parent.insertBefore(this.domWrapper,nextSibling);
	this.domNodes.push(this.domWrapper);
	// Apply the selection tracker data to the DOM
	if(!isSnippetMode) {
		this.applySelectionTrackerData();
	}
	// Render our child widgets
	this.renderChildren(this.domContent,null);
	if(!this.document.isTiddlyWikiFakeDom) {
		if(isSnippetMode) {
			// Apply search snippets
			this.applySnippets();
		} else {
			// Get the list of annotation tiddlers
			this.getAnnotationTiddlers();
			// Apply annotations
			this.applyAnnotations();
			// Apply search overlays
			this.applySearch();
		}
	}
	// Save the width of the wrapper so that we can tell when it changes
	this.wrapperWidth = this.domWrapper.offsetWidth;
};

/*
Compute the internal state of the widget
*/
DynannotateWidget.prototype.execute = function() {
	// Make the child widgets
	this.makeChildWidgets();
};

DynannotateWidget.prototype.isSnippetMode = function() {
	return this.getAttribute("searchDisplay") === "snippet";
}

/*
Save the data attributes required by the selection tracker
*/
DynannotateWidget.prototype.applySelectionTrackerData = function() {
	if(this.hasAttribute("selection")) {
		this.domContent.setAttribute("data-annotation-selection-save",this.getAttribute("selection"));
	} else {
		this.domContent.removeAttribute("data-annotation-selection-save");
	}
	if(this.hasAttribute("selectionPopup")) {
		this.domContent.setAttribute("data-annotation-selection-popup",this.getAttribute("selectionPopup"));
	} else {
		this.domContent.removeAttribute("data-annotation-selection-popup");
	}
	if(this.hasAttribute("selectionPrefix")) {
		this.domContent.setAttribute("data-annotation-selection-prefix-save",this.getAttribute("selectionPrefix"));
	} else {
		this.domContent.removeAttribute("data-annotation-selection-prefix-save");
	}
	if(this.hasAttribute("selectionSuffix")) {
		this.domContent.setAttribute("data-annotation-selection-suffix-save",this.getAttribute("selectionSuffix"));
	} else {
		this.domContent.removeAttribute("data-annotation-selection-suffix-save");
	}
};

/*
Create overlay dom elements to cover a specified range

options include:
	startNode: Start node of range
	startOffset: Start offset of range
	endNode: End node of range
	endOffset: End offset of range
	className: Optional classname for the overlay
	wrapper: Wrapper dom node for the overlays
	colour: Optional CSS colour for the overlay
	blendMode: Optional CSS mix blend mode for the overlay
	onclick: Optional click event handler for the overlay
*/
DynannotateWidget.prototype.createOverlay = function(options) {
	var self = this;
	// Create a range covering the text
	var range = this.document.createRange();
	range.setStart(options.startNode,options.startOffset);
	range.setEnd(options.endNode,options.endOffset);
	// Get the position of the range
	var rects = range.getClientRects();
	if(rects) {
		// Paint each rectangle
		var parentRect = this.domContent.getBoundingClientRect();
		$tw.utils.each(rects,function(rect) {
			var domOverlay = self.document.createElement("div");
			domOverlay.className = (options.className || "") + " tc-dynaview-request-refresh-on-resize";
			domOverlay.style.top = (rect.top - parentRect.top) + "px";
			domOverlay.style.left = (rect.left - parentRect.left) + "px";
			domOverlay.style.width = rect.width + "px";
			domOverlay.style.height = rect.height + "px";
			domOverlay.style.backgroundColor = options.colour;
			domOverlay.style.mixBlendMode = options.blendMode;
			if(options.onclick) {
				domOverlay.addEventListener("click",function(event) {
					var modifierKey = event.ctrlKey && !event.shiftKey ? "ctrl" : event.shiftKey && !event.ctrlKey ? "shift" : event.ctrlKey && event.shiftKey ? "ctrl-shift" : "normal";
					options.onclick(event,domOverlay,modifierKey);
				},false);
			}
			options.wrapper.appendChild(domOverlay);
		});
	}
};

DynannotateWidget.prototype.getAnnotationTiddlers = function() {
	this.annotationTiddlers = this.wiki.filterTiddlers(this.getAttribute("filter",""),this);
};

DynannotateWidget.prototype.removeAnnotations = function() {
	while(this.domAnnotations.hasChildNodes()) {
		this.domAnnotations.removeChild(this.domAnnotations.firstChild);
	}
};

DynannotateWidget.prototype.applyAnnotations = function() {
	var self = this;
	// Remove any previous annotation overlays
	this.removeAnnotations();
	// Don't do anything if there are no annotations to apply
	if(this.annotationTiddlers.length === 0 && !this.hasAttribute("target")) {
		return;
	}
	// Build the map of the text content
	var textMap = new TextMap(this.domContent);
	// We'll dynamically build the click event handler so that we can reuse it
	var clickHandlerFn = function(title) {
		return function(event,domOverlay,modifierKey) {
			var bounds = domOverlay.getBoundingClientRect();
			self.invokeActionString(self.getAttribute("actions"),self,event,{
				annotationTiddler: title,
				modifier: modifierKey,
				"tv-selection-posx": (bounds.left).toString(),
				"tv-selection-posy": (bounds.top).toString(),
				"tv-selection-width": (bounds.width).toString(),
				"tv-selection-height": (bounds.height).toString(),
				"tv-selection-coords": Popup.buildCoordinates(Popup.coordinatePrefix.csOffsetParent,bounds)
			});
			if(self.hasAttribute("popup")) {
				$tw.popup.triggerPopup({
					domNode: domOverlay,
                    title: self.getAttribute("popup"),
                    floating: self.getAttribute("floating"),
					wiki: self.wiki
				});
			}
		};
	};
	// Draw the overlay for the "target" attribute
	if(this.hasAttribute("target")) {
		var result = textMap.findText(this.getAttribute("target"),this.getAttribute("targetPrefix"),this.getAttribute("targetSuffix"));
		if(result) {
			this.createOverlay({
				startNode: result.startNode,
				startOffset: result.startOffset,
				endNode: result.endNode,
				endOffset: result.endOffset,
				wrapper: self.domAnnotations,
				className: "tc-dynannotation-annotation-overlay",
				onclick: clickHandlerFn(null)
			});
		}
	}
	// Draw the overlays for each annotation tiddler
	$tw.utils.each(this.annotationTiddlers,function(title) {
		var tiddler = self.wiki.getTiddler(title),
			annotateText = tiddler.fields["annotate-text"],
			annotatePrefix = tiddler.fields["annotate-prefix"],
			annotateSuffix = tiddler.fields["annotate-suffix"];
		if(tiddler && annotateText) {
			var result = textMap.findText(annotateText,annotatePrefix,annotateSuffix);
			if(result) {
				self.createOverlay({
					startNode: result.startNode,
					startOffset: result.startOffset,
					endNode: result.endNode,
					endOffset: result.endOffset,
					wrapper: self.domAnnotations,
					className: "tc-dynannotation-annotation-overlay",
					colour: tiddler.fields["annotate-colour"],
					blendMode: tiddler.fields["annotate-blend-mode"],
					onclick: clickHandlerFn(title)
				});
			}
		}
	});
};

DynannotateWidget.prototype.removeSearch = function() {
	while(this.domSearches.hasChildNodes()) {
		this.domSearches.removeChild(this.domSearches.firstChild);
	}
};

DynannotateWidget.prototype.applySearch = function() {
	var self = this;
	// Remove any previous search overlays
	this.removeSearch();
	// Gather parameters
	var searchString = this.getAttribute("search",""),
		searchMode = this.getAttribute("searchMode"),
		searchCaseSensitive = this.getAttribute("searchCaseSensitive","yes") === "yes",
		searchMinLength = parseInt(this.getAttribute("searchMinLength","1"),10) || 1;
	// Bail if search string too short
	if(searchString.length < searchMinLength) {
		return;
	}
	// Build the map of the text content
	var textMap = new TextMap(this.domContent);
	// Search for the string
	var matches = textMap.search(this.getAttribute("search",""),{
		mode: this.getAttribute("searchMode"),
		caseSensitive: this.getAttribute("searchCaseSensitive","yes") === "yes"
	});
	// Create overlays for each match
	$tw.utils.each(matches,function(match) {
		self.createOverlay({
			startNode: match.startNode,
			startOffset: match.startOffset,
			endNode: match.endNode,
			endOffset: match.endOffset,
			wrapper: self.domSearches,
			className: "tc-dynannotation-search-overlay " + self.getAttribute("searchClass","")
		});
	});
};

DynannotateWidget.prototype.removeSnippets = function() {
	while(this.domSnippets.hasChildNodes()) {
		this.domSnippets.removeChild(this.domSnippets.firstChild);
	}
};

DynannotateWidget.prototype.applySnippets = function() {
	var self = this,
		contextLength = parseInt(this.getAttribute("snippetContextLength","33"),10) || 0;
	// Build the map of the text content
	var textMap = new TextMap(this.domContent);
	// Remove any previous snippets
	this.removeSnippets();
	// Gather parameters
	var searchString = this.getAttribute("search",""),
		searchMode = this.getAttribute("searchMode"),
		searchCaseSensitive = this.getAttribute("searchCaseSensitive","yes") === "yes",
		searchMinLength = parseInt(this.getAttribute("searchMinLength","1"),10) || 1;
	// Build the map of the text content
	var textMap = new TextMap(this.domContent);
	// Search for the string
	var matches = textMap.search(this.getAttribute("search",""),{
		mode: this.getAttribute("searchMode"),
		caseSensitive: this.getAttribute("searchCaseSensitive","no") === "yes"
	});
	// Output a snippet for each match
	if(matches && matches.length > 0) {
		var merged = false, // Keep track of whether the context of the previous match merges into this one
			ellipsis = String.fromCharCode(8230),
			container = null; // Track the container so that we can reuse the same container for merged matches
		$tw.utils.each(matches,function(match,index) {
			// Create a container if we're not reusing it
			if(!container) {
				container = $tw.utils.domMaker("div",{
					"class": "tc-dynannotate-snippet"
				});
				self.domSnippets.appendChild(container);
			}
			// Output the preceding context if it wasn't merged into the previous match
			if(!merged) {
				container.appendChild($tw.utils.domMaker("span",{
					text: (match.startPos < contextLength ? "" : ellipsis) +
						textMap.string.slice(Math.max(match.startPos - contextLength,0),match.startPos),
					"class": "tc-dynannotate-snippet-context"
				}));
			}
			// Output the match
			container.appendChild($tw.utils.domMaker("span",{
				text: textMap.string.slice(match.startPos,match.endPos),
				"class": "tc-dynannotate-snippet-highlight " + self.getAttribute("searchClass","")
			}));
			// Does the context of this match merge into the next?
			merged = index < matches.length - 1 && matches[index + 1].startPos - match.endPos <= 2 * contextLength;
			if(merged) {
				// If they're merged, use the context up until the next match
				container.appendChild($tw.utils.domMaker("span",{
					text: textMap.string.slice(match.endPos,matches[index + 1].startPos),
					"class": "tc-dynannotate-snippet-context"
				}));
			} else {
				// If they're not merged, use the context up to the end
				container.appendChild($tw.utils.domMaker("span",{
					text: textMap.string.slice(match.endPos,match.endPos + contextLength) +
						((match.endPos + contextLength) >= textMap.string.length ? "" : ellipsis),
					"class": "tc-dynannotate-snippet-context"
				}));
			}
			// Reuse the next container if we're merged
			if(!merged) {
				container = null;
			}
		});
	}
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
DynannotateWidget.prototype.refresh = function(changedTiddlers) {
	// Get the changed attributes
	var changedAttributes = this.computeAttributes();
	// Refresh completely if the "searchDisplay" attribute has changed
	if(changedAttributes.searchDisplay) {
		this.refreshSelf();
		return true;
	}
	// Check whether we're in snippet mode
	var isSnippetMode = this.isSnippetMode();
	// Refresh the child widgets
	var childrenDidRefresh = this.refreshChildren(changedTiddlers);
	// Reapply the selection tracker data to the DOM
	if(changedAttributes.selection || changedAttributes.selectionPrefix || changedAttributes.selectionSuffix || changedAttributes.selectionPopup) {
		this.applySelectionTrackerData();
	}
	// Reapply the annotations if the children refreshed or the main wrapper resized
	var wrapperWidth = this.domWrapper.offsetWidth,
		hasResized = wrapperWidth !== this.wrapperWidth || changedTiddlers["$:/state/DynaView/ViewportDimensions/ResizeCount"],
		oldAnnotationTiddlers = this.annotationTiddlers;
	this.getAnnotationTiddlers();
	if(!isSnippetMode && (
		childrenDidRefresh ||
		hasResized ||
		changedAttributes.target ||
		changedAttributes.targetPrefix ||
		changedAttributes.targetSuffix ||
		changedAttributes.filter ||
		changedAttributes.actions ||
		changedAttributes.popup ||
		!$tw.utils.isArrayEqual(oldAnnotationTiddlers,this.annotationTiddlers) ||
		this.annotationTiddlers.find(function(title) {
			return changedTiddlers[title];
		}) !== undefined
	)) {
		this.applyAnnotations();
	}
	if(!isSnippetMode && (
		childrenDidRefresh ||
		hasResized ||
		changedAttributes.search ||
		changedAttributes.searchMinLength ||
		changedAttributes.searchClass ||
		changedAttributes.searchMode ||
		changedAttributes.searchCaseSensitive
	)) {
		this.applySearch();
	}
	if(isSnippetMode && (
		childrenDidRefresh ||
		hasResized ||
		changedAttributes.search ||
		changedAttributes.searchMinLength ||
		changedAttributes.searchClass ||
		changedAttributes.searchMode ||
		changedAttributes.searchCaseSensitive
	)) {
		this.applySnippets();
	}
	this.wrapperWidth = wrapperWidth;
	return childrenDidRefresh;
};

exports.dynannotate = DynannotateWidget;

})();
