/*\
title: $:/core/modules/utils/dom/dragndrop.js
type: application/javascript
module-type: utils

Browser data transfer utilities, used with the clipboard and drag and drop

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Options:

domNode: dom node to make draggable
dragImageType: "pill", "blank" or "dom" (the default)
dragTiddlerFn: optional function to retrieve the title of tiddler to drag
dragFilterFn: optional function to retreive the filter defining a list of tiddlers to drag
widget: widget to use as the contect for the filter
*/
exports.makeDraggable = function(options) {
	var dragImageType = options.dragImageType || "dom",
		dragImage,
		domNode = options.domNode;
	// Make the dom node draggable (not necessary for anchor tags)
	if((domNode.tagName || "").toLowerCase() !== "a") {
		domNode.setAttribute("draggable","true");
	}
	// Add event handlers
	$tw.utils.addEventListeners(domNode,[
		{name: "dragstart", handlerFunction: function(event) {
			if(event.dataTransfer === undefined) {
				return false;
			}
			// Collect the tiddlers being dragged
			var dragTiddler = options.dragTiddlerFn && options.dragTiddlerFn(),
				dragFilter = options.dragFilterFn && options.dragFilterFn(),
				titles = dragTiddler ? [dragTiddler] : [],
			    	startActions = options.startActions;
			if(dragFilter) {
				titles.push.apply(titles,options.widget.wiki.filterTiddlers(dragFilter,options.widget));
			}
			var titleString = $tw.utils.stringifyList(titles);
			// Check that we've something to drag
			if(titles.length > 0 && event.target === domNode) {
				// Mark the drag in progress
				$tw.dragInProgress = domNode;
				// Set the dragging class on the element being dragged
				$tw.utils.addClass(event.target,"tc-dragging");
				// Invoke drag-start actions if given
				if(startActions !== undefined) {
					options.widget.invokeActionString(startActions,options.widget,event,{actionTiddler: titleString});
				}
				// Create the drag image elements
				dragImage = options.widget.document.createElement("div");
				dragImage.className = "tc-tiddler-dragger";
				var inner = options.widget.document.createElement("div");
				inner.className = "tc-tiddler-dragger-inner";
				inner.appendChild(options.widget.document.createTextNode(
					titles.length === 1 ? 
						titles[0] :
						titles.length + " tiddlers"
				));
				dragImage.appendChild(inner);
				options.widget.document.body.appendChild(dragImage);
				// Set the data transfer properties
				var dataTransfer = event.dataTransfer;
				// Set up the image
				dataTransfer.effectAllowed = "all";
				if(dataTransfer.setDragImage) {
					if(dragImageType === "pill") {
						dataTransfer.setDragImage(dragImage.firstChild,-16,-16);
					} else if (dragImageType === "blank") {
						dragImage.removeChild(dragImage.firstChild);
						dataTransfer.setDragImage(dragImage,0,0);
					} else {
						var r = domNode.getBoundingClientRect();
						dataTransfer.setDragImage(domNode,event.clientX-r.left,event.clientY-r.top);
					}
				}
				// Set up the data transfer
				if(dataTransfer.clearData) {
					dataTransfer.clearData();
				}
				var jsonData = [];
				if(titles.length > 1) {
					titles.forEach(function(title) {
						jsonData.push(options.widget.wiki.getTiddlerAsJson(title));
					});
					jsonData = "[" + jsonData.join(",") + "]";
				} else {
					jsonData = options.widget.wiki.getTiddlerAsJson(titles[0]);
				}
				// IE doesn't like these content types
				if(!$tw.browser.isIE) {
					dataTransfer.setData("text/vnd.tiddler",jsonData);
					dataTransfer.setData("text/plain",titleString);
					dataTransfer.setData("text/x-moz-url","data:text/vnd.tiddler," + encodeURIComponent(jsonData));
				}
				dataTransfer.setData("URL","data:text/vnd.tiddler," + encodeURIComponent(jsonData));
				dataTransfer.setData("Text",titleString);
				event.stopPropagation();
			}
			return false;
		}},
		{name: "dragend", handlerFunction: function(event) {
			if(event.target === domNode) {
				// Collect the tiddlers being dragged
				var dragTiddler = options.dragTiddlerFn && options.dragTiddlerFn(),
					dragFilter = options.dragFilterFn && options.dragFilterFn(),
					titles = dragTiddler ? [dragTiddler] : [],
			    		endActions = options.endActions;
				if(dragFilter) {
					titles.push.apply(titles,options.widget.wiki.filterTiddlers(dragFilter,options.widget));
				}
				var titleString = $tw.utils.stringifyList(titles);
				$tw.dragInProgress = null;
				// Invoke drag-end actions if given
				if(endActions !== undefined) {
					options.widget.invokeActionString(endActions,options.widget,event,{actionTiddler: titleString});
				}
				// Remove the dragging class on the element being dragged
				$tw.utils.removeClass(event.target,"tc-dragging");
				// Delete the drag image element
				if(dragImage) {
					dragImage.parentNode.removeChild(dragImage);
					dragImage = null;
				}
			}
			return false;
		}}
	]);
};

exports.importDataTransfer = function(dataTransfer,fallbackTitle,callback) {
	// Try each provided data type in turn
	if($tw.log.IMPORT) {
		console.log("Available data types:");
		for(var type=0; type<dataTransfer.types.length; type++) {
			console.log("type",dataTransfer.types[type],dataTransfer.getData(dataTransfer.types[type]))
		}
	}
	for(var t=0; t<importDataTypes.length; t++) {
		if(!$tw.browser.isIE || importDataTypes[t].IECompatible) {
			// Get the data
			var dataType = importDataTypes[t];
				var data = dataTransfer.getData(dataType.type);
			// Import the tiddlers in the data
			if(data !== "" && data !== null) {
				if($tw.log.IMPORT) {
					console.log("Importing data type '" + dataType.type + "', data: '" + data + "'")
				}
				var tiddlerFields = dataType.toTiddlerFieldsArray(data,fallbackTitle);
				callback(tiddlerFields);
				return;
			}
		}
	}
};

var importDataTypes = [
	{type: "text/vnd.tiddler", IECompatible: false, toTiddlerFieldsArray: function(data,fallbackTitle) {
		return parseJSONTiddlers(data,fallbackTitle);
	}},
	{type: "URL", IECompatible: true, toTiddlerFieldsArray: function(data,fallbackTitle) {
		// Check for tiddler data URI
		var match = $tw.utils.decodeURIComponentSafe(data).match(/^data\:text\/vnd\.tiddler,(.*)/i);
		if(match) {
			return parseJSONTiddlers(match[1],fallbackTitle);
		} else {
			return [{title: fallbackTitle, text: data}]; // As URL string
		}
	}},
	{type: "text/x-moz-url", IECompatible: false, toTiddlerFieldsArray: function(data,fallbackTitle) {
		// Check for tiddler data URI
		var match = $tw.utils.decodeURIComponentSafe(data).match(/^data\:text\/vnd\.tiddler,(.*)/i);
		if(match) {
			return parseJSONTiddlers(match[1],fallbackTitle);
		} else {
			return [{title: fallbackTitle, text: data}]; // As URL string
		}
	}},
	{type: "text/html", IECompatible: false, toTiddlerFieldsArray: function(data,fallbackTitle) {
		return [{title: fallbackTitle, text: data}];
	}},
	{type: "text/plain", IECompatible: false, toTiddlerFieldsArray: function(data,fallbackTitle) {
		return [{title: fallbackTitle, text: data}];
	}},
	{type: "Text", IECompatible: true, toTiddlerFieldsArray: function(data,fallbackTitle) {
		return [{title: fallbackTitle, text: data}];
	}},
	{type: "text/uri-list", IECompatible: false, toTiddlerFieldsArray: function(data,fallbackTitle) {
		return [{title: fallbackTitle, text: data}];
	}}
];

function parseJSONTiddlers(json,fallbackTitle) {
	var data = JSON.parse(json);
	if(!$tw.utils.isArray(data)) {
		data = [data];
	}
	data.forEach(function(fields) {
		fields.title = fields.title || fallbackTitle;
	});
	return data;
};

exports.dragEventContainsFiles = function(event) {
	if(event.dataTransfer.types) {
		for(var i=0; i<event.dataTransfer.types.length; i++) {
			if(event.dataTransfer.types[i] === "Files") {
				return true;
				break;
			}
		}
	}
	return false;
};

})();
