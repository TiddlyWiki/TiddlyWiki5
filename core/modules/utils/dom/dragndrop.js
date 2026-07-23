/*\
title: $:/core/modules/utils/dom/dragndrop.js
type: application/javascript
module-type: utils

Browser data transfer utilities, used with the clipboard and drag and drop

\*/

"use strict";

/*
Options:

domNode: dom node to make draggable
selector: CSS selector to identify element within domNode to be used as drag handle (optional)
dragImageType: "pill", "blank" or "dom" (the default)
dragTiddlerFn: optional function to retrieve the title of tiddler to drag
dragFilterFn: optional function to retreive the filter defining a list of tiddlers to drag
widget: widget to use as the context for the filter
*/
exports.makeDraggable = function(options) {
	var dragImageType = options.dragImageType || "dom",
		dragImage,
		domNode = options.domNode;
	// Make the dom node draggable (not necessary for anchor tags)
	if(!options.selector && ((domNode.tagName || "").toLowerCase() !== "a")) {
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
				startActions = options.startActions,
				variables;
			if(dragFilter) {
				titles.push.apply(titles,options.widget.wiki.filterTiddlers(dragFilter,options.widget));
			}
			var titleString = $tw.utils.stringifyList(titles);
			// Check that we've something to drag
			if(titles.length > 0 && (options.selector && $tw.utils.domMatchesSelector(event.target,options.selector) || event.target === domNode)) {
				// Mark the drag in progress
				$tw.dragInProgress = domNode;
				// Set the dragging class on the element being dragged
				$tw.utils.addClass(domNode,"tc-dragging");
				// Invoke drag-start actions if given
				if(startActions !== undefined) {
					// Collect our variables
					variables = $tw.utils.collectDOMVariables(domNode,null,event);
					variables.modifier = $tw.keyboardManager.getEventModifierKeyDescriptor(event);
					variables["actionTiddler"] = titleString;
					options.widget.invokeActionString(startActions,options.widget,event,variables);
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
					} else if(dragImageType === "blank") {
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
				var tiddlerDataURI = "data:text/vnd.tiddler," + encodeURIComponent(jsonData);
				// IE doesn't like these content types
				if(!$tw.browser.isIE) {
					dataTransfer.setData("text/vnd.tiddler",jsonData);
					dataTransfer.setData("text/plain",titleString);
					dataTransfer.setData("text/x-moz-url",tiddlerDataURI);
					// text/html is the only standard MIME type that reliably
					// survives Chromium's cross-app drag-data sanitiser on
					// Linux. Embed the data: URI inside an anchor's href so
					// the receiver can extract it; the visible text falls
					// back to the title for non-TW receivers.
					try {
						dataTransfer.setData("text/html",
							'<a href="' + tiddlerDataURI.replace(/"/g,"&quot;") + '">' +
							titleString.replace(/[<>&]/g,function(c){return ({"<":"&lt;",">":"&gt;","&":"&amp;"})[c];}) +
							"</a>"
						);
					} catch(e) {}
				}
				// If browser is Chrome-like and has a touch-input device do NOT .setData
				if(!($tw.browser.isMobileChrome)) {
					dataTransfer.setData("URL",tiddlerDataURI);
				}
				dataTransfer.setData("Text",titleString);
				event.stopPropagation();
			}
			return false;
		}},
		{name: "dragend", handlerFunction: function(event) {
			if((options.selector && $tw.utils.domMatchesSelector(event.target,options.selector)) || event.target === domNode) {
				// Collect the tiddlers being dragged
				var dragTiddler = options.dragTiddlerFn && options.dragTiddlerFn(),
					dragFilter = options.dragFilterFn && options.dragFilterFn(),
					titles = dragTiddler ? [dragTiddler] : [],
					endActions = options.endActions,
					variables;
				if(dragFilter) {
					titles.push.apply(titles,options.widget.wiki.filterTiddlers(dragFilter,options.widget));
				}
				var titleString = $tw.utils.stringifyList(titles);
				$tw.dragInProgress = null;
				// Invoke drag-end actions if given
				if(endActions !== undefined) {
					variables = $tw.utils.collectDOMVariables(domNode,null,event);
					variables.modifier = $tw.keyboardManager.getEventModifierKeyDescriptor(event);
					variables["actionTiddler"] = titleString;
					options.widget.invokeActionString(endActions,options.widget,event,variables);
				}
				// Remove the dragging class on the element being dragged
				$tw.utils.removeClass(domNode,"tc-dragging");
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
			console.log("type",dataTransfer.types[type],dataTransfer.getData(dataTransfer.types[type]));
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
					console.log("Importing data type '" + dataType.type + "', data: '" + data + "'");
				}
				var tiddlerFields = dataType.toTiddlerFieldsArray(data,fallbackTitle);
				callback(tiddlerFields);
				return;
			}
		}
	}
};

exports.importPaste = function(item,fallbackTitle,callback) {
	// Try each provided data type in turn
	for(var t=0; t<importDataTypes.length; t++) {
		if(item.type === importDataTypes[t].type) {
			// Get the data
			var dataType = importDataTypes[t];

			item.getAsString(function(data){
				if($tw.log.IMPORT) {
					console.log("Importing data type '" + dataType.type + "', data: '" + data + "'");
				}
				var tiddlerFields = dataType.toTiddlerFieldsArray(data,fallbackTitle);
				callback(tiddlerFields);
			});
			return;
		}
	}
};

exports.itemHasValidDataType = function(item) {
	for(var t=0; t<importDataTypes.length; t++) {
		if(!$tw.browser.isIE || importDataTypes[t].IECompatible) {
			if(item.type === importDataTypes[t].type) {
				return true;
			}
		}
	}
	return false;
};

// Chromium on Linux delivers text/html to JS as UTF-16LE bytes interpreted as
// Latin-1 (every other char is null). Detect that shape and decode before
// pattern matching. Used by the text/html entry in importDataTypes below.
function maybeDecodeUtf16Html(data) {
	if(!data || data.length < 4) { return data; }
	var sample = Math.min(data.length, 64), nulls = 0;
	for(var i = 1; i < sample; i += 2) {
		if(data.charCodeAt(i) === 0) { nulls++; }
	}
	if(nulls < Math.floor(sample / 2) * 0.8) { return data; }
	if(typeof TextDecoder !== "undefined") {
		try {
			var bytes = new Uint8Array(data.length);
			for(var k = 0; k < data.length; k++) { bytes[k] = data.charCodeAt(k) & 0xff; }
			return new TextDecoder("utf-16le").decode(bytes).replace(/^\uFEFF/, "");
		} catch(e) {}
	}
	// ASCII-safe fallback: take every even-indexed char
	var stripped = "";
	for(var j = 0; j < data.length; j += 2) { stripped += data.charAt(j); }
	return stripped;
}

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
		// Decode Chromium's Linux UTF-16LE-as-Latin-1 quirk if present
		data = maybeDecodeUtf16Html(data);
		// Look for an embedded data:text/vnd.tiddler URI inside any href. Match on
		// the still-URI-encoded form so JSON %22 doesn't truncate the capture. The
		// stop-class is only " < > because encodeURIComponent always percent-encodes
		// those three (so they reliably bound the href value), while characters it
		// leaves literal (notably ' and ) ) must NOT terminate the match or the
		// payload would be truncated and fail to parse.
		var encMatch = data && data.match(/data:text\/vnd\.tiddler,([^"<>]+)/i);
		if(encMatch) {
			try {
				return parseJSONTiddlers(decodeURIComponent(encMatch[1]),fallbackTitle);
			} catch(e) {}
		}
		return [{title: fallbackTitle, text: data}];
	}},
	{type: "text/plain", IECompatible: false, toTiddlerFieldsArray: function(data,fallbackTitle) {
		return [{title: fallbackTitle, text: data}];
	}},
	{type: "Text", IECompatible: true, toTiddlerFieldsArray: function(data,fallbackTitle) {
		return [{title: fallbackTitle, text: data}];
	}},
	{type: "text/uri-list", IECompatible: false, toTiddlerFieldsArray: function(data,fallbackTitle) {
		// Check for tiddler data URI
		var match = $tw.utils.decodeURIComponentSafe(data).match(/^data\:text\/vnd\.tiddler,(.*)/i);
		if(match) {
			return parseJSONTiddlers(match[1],fallbackTitle);
		} else {
			return [{title: fallbackTitle, text: data}]; // As URL string
		}
	}}
];

function parseJSONTiddlers(json,fallbackTitle) {
	var data = $tw.utils.parseJSONSafe(json);
	if(!$tw.utils.isArray(data)) {
		data = [data];
	}
	data.forEach(function(fields) {
		fields.title = fields.title || fallbackTitle;
	});
	return data;
};

function dragEventContainsType(event,targetType) {
	if(event.dataTransfer.types) {
		for(var i=0; i<event.dataTransfer.types.length; i++) {
			if(event.dataTransfer.types[i] === targetType) {
				return true;
			}
		}
	}
	return false;
};

exports.dragEventContainsFiles = function(event) {
	return (dragEventContainsType(event,"Files") && !dragEventContainsType(event,"text/plain"));
};

exports.dragEventContainsType = dragEventContainsType;
