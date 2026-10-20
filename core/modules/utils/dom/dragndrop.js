/*\
title: $:/core/modules/utils/dom/dragndrop.js
type: application/javascript
module-type: utils

Browser data transfer utilities, used with the clipboard and drag and drop

\*/

"use strict";

var DRAGGING_TITLE = "$:/state/dragging";

// Each drag gets its own identity, so that state left behind by an earlier one can be told apart
var dragCount = 0;

function markDragInProgress(domNode,status) {
	var doc = domNode.ownerDocument;
	if(doc && doc.body && doc.body.classList) {
		doc.body.classList[status ? "add" : "remove"]("tc-drag-in-progress");
	}
	if(status) {
		$tw.utils.pinColumnLayout(domNode);
	} else {
		$tw.utils.releaseColumnLayout(doc);
	}
}

function recordDrag(widget,titles) {
	if(widget && widget.wiki) {
		widget.wiki.addTiddler(new $tw.Tiddler({
			title: DRAGGING_TITLE,
			text: "yes",
			list: titles,
			"drag-id": (++dragCount) + "-" + Date.now()
		}));
	}
}

function forgetDrag(widget) {
	if(widget && widget.wiki) {
		widget.wiki.deleteTiddler(DRAGGING_TITLE);
	}
}

function endDragInProgress(domNode,widget) {
	if($tw.dragInProgress !== domNode) {
		return;
	}
	$tw.utils.nextTick(function() {
		if($tw.dragInProgress === domNode) {
			$tw.dragInProgress = null;
			markDragInProgress(domNode,false);
			forgetDrag(widget);
		}
	});
}

function installDragEndBackstop(domNode,widget,endActions,titles) {
	var doc = domNode.ownerDocument;
	if(!doc || !doc.addEventListener) {
		return;
	}
	var handler = function() {
		doc.removeEventListener("pointerdown",handler,true);
		// A dragend at a node re-rendered away during the drag reaches no listener, so finish it here
		if($tw.dragInProgress === domNode && endActions !== undefined && widget) {
			try {
				widget.invokeActionString(endActions,widget,null,{actionTiddler: titles});
			} catch(e) {
			}
		}
		endDragInProgress(domNode,widget);
	};
	doc.addEventListener("pointerdown",handler,true);
}

// Room left around the copy of a dragged element, and clearance from the edges of the viewport
var DRAG_IMAGE_HALO = 32;
var DRAG_IMAGE_INSET = 8;

var DRAG_IMAGE_ATTRIBUTE = "data-tc-drag-image";
var DRAG_IMAGE_Z_INDEX = "2147483647";

// These keep what they hold in the live element rather than in the markup
var CONTROL_TAGS = ["input","textarea","select"];

// Properties of the ancestors that would crop the copy or paint something behind it
var DRAG_IMAGE_ANCESTOR_STYLES = {
	position: "static",
	display: "block",
	overflow: "visible",
	contain: "none",
	transform: "none",
	filter: "none",
	"backdrop-filter": "none",
	"clip-path": "none",
	mask: "none",
	opacity: "1",
	background: "none",
	"box-shadow": "none",
	outline: "none",
	border: "0",
	margin: "0",
	padding: "0",
	width: "auto",
	height: "auto",
	"min-width": "0",
	"min-height": "0",
	"max-width": "none",
	"max-height": "none"
};

/*
Apply styles that the stylesheets must not overrule
*/
function forceStyles(domNode,styles) {
	for(var name in styles) {
		domNode.style.setProperty(name,styles[name],"important");
	}
}

/*
The pill drag image: the title of what is being dragged, on a rounded label
*/
function createPillDragImage(document,titles) {
	var dragImage = document.createElement("div"),
		inner = document.createElement("div");
	dragImage.className = "tc-tiddler-dragger";
	inner.className = "tc-tiddler-dragger-inner";
	inner.appendChild(document.createTextNode(
		titles.length === 1 ?
			titles[0] :
			titles.length + " tiddlers"
	));
	dragImage.appendChild(inner);
	document.body.appendChild(dragImage);
	return dragImage;
}

/*
Fill in what a copy does not carry: control values, canvases, and iframes, which copy as empty documents
*/
function copyLiveContent(fromNode,toNode) {
	var sources,copies,t;
	sources = fromNode.querySelectorAll("input,textarea,select");
	copies = toNode.querySelectorAll("input,textarea,select");
	for(t=0; t<sources.length && t<copies.length; t++) {
		copyControlValue(sources[t],copies[t]);
	}
	sources = fromNode.querySelectorAll("canvas");
	copies = toNode.querySelectorAll("canvas");
	for(t=0; t<sources.length && t<copies.length; t++) {
		try {
			copies[t].getContext("2d").drawImage(sources[t],0,0);
		} catch(e) {
		}
	}
	// Every text editor is built in an iframe, which the browser cannot picture at all
	sources = fromNode.querySelectorAll("iframe");
	copies = toNode.querySelectorAll("iframe");
	for(t=0; t<sources.length && t<copies.length; t++) {
		if(copies[t].parentNode) {
			copies[t].parentNode.replaceChild(makeFrameStandIn(toNode.ownerDocument,sources[t]),copies[t]);
		}
	}
}

function copyControlValue(fromNode,toNode) {
	var tag = fromNode.tagName.toLowerCase();
	if(tag === "select") {
		toNode.selectedIndex = fromNode.selectedIndex;
	} else if(fromNode.type === "checkbox" || fromNode.type === "radio") {
		toNode.checked = fromNode.checked;
	} else if(tag === "textarea") {
		// A textarea shows its content until something sets a value on the live element
		toNode.textContent = fromNode.value;
		toNode.value = fromNode.value;
	} else {
		toNode.setAttribute("value",fromNode.value);
		toNode.value = fromNode.value;
	}
}

/*
Stand in for an iframe, carrying across the styles its own document gave what it holds
*/
function makeFrameStandIn(document,frame) {
	var standIn = document.createElement("div"),
		rect = frame.getBoundingClientRect(),
		body;
	standIn.className = frame.className;
	standIn.setAttribute("style",frame.getAttribute("style") || "");
	forceStyles(standIn,{
		"box-sizing": "border-box",
		width: rect.width + "px",
		height: rect.height + "px",
		overflow: "hidden"
	});
	try {
		body = frame.contentDocument && frame.contentDocument.body;
	} catch(e) {
		body = null;
	}
	$tw.utils.each(body ? body.children : [],function(child) {
		var copy = child.cloneNode(true),
			descendants = child.querySelectorAll("*");
		$tw.utils.copyStyles(child,copy);
		$tw.utils.each(copy.querySelectorAll("*"),function(node,index) {
			$tw.utils.copyStyles(descendants[index],node);
		});
		copyLiveContent(child,copy);
		if(CONTROL_TAGS.indexOf(child.tagName.toLowerCase()) !== -1) {
			copyControlValue(child,copy);
		}
		standIn.appendChild(copy);
	});
	return standIn;
}

/*
How much the copy must shrink to fit on screen, since the browser pictures only what the viewport holds
*/
function getDragImageScale(domNode,rect) {
	var view = domNode.ownerDocument.defaultView,
		halo = 2 * DRAG_IMAGE_HALO;
	if(!view || !rect.width || !rect.height) {
		return 1;
	}
	return Math.min(1,
		(view.innerWidth - DRAG_IMAGE_INSET) / (rect.width + halo),
		(view.innerHeight - DRAG_IMAGE_INSET) / (rect.height + halo));
}

/*
The dom drag image: a copy of the element in an emptied out stack of its ancestors, laid over it on screen
*/
function createDomDragImage(domNode,rect,scale) {
	var doc = domNode.ownerDocument,
		clone = domNode.cloneNode(true),
		dragImage = clone,
		ancestor = domNode.parentNode,
		shell;
	copyLiveContent(domNode,clone);
	forceStyles(clone,{
		"box-sizing": "border-box",
		margin: "0",
		width: rect.width + "px"
	});
	// The element is a ghost in a dashed box while it is dragged, but its picture should be solid and plain
	$tw.utils.removeClass(clone,"tc-dragging");
	$tw.utils.removeClass(clone,"tc-live-reorderable-ghost");
	$tw.utils.removeClass(clone,"tc-live-reorderable-drop-target");
	// Rebuild the ancestors, so the selectors that reach the element through them still match
	while(ancestor && ancestor.nodeType === 1 && ancestor !== doc.body && ancestor !== doc.documentElement) {
		shell = ancestor.cloneNode(false);
		shell.appendChild(dragImage);
		forceStyles(shell,DRAG_IMAGE_ANCESTOR_STYLES);
		dragImage = shell;
		ancestor = ancestor.parentNode;
	}
	dragImage.setAttribute(DRAG_IMAGE_ATTRIBUTE,"yes");
	dragImage.appendChild(makeDragImageStylesheet(doc));
	forceStyles(dragImage,{
		position: "fixed",
		"box-sizing": "border-box",
		// The picture is the box of the copy: leave room for a shadow, clip what reaches further
		padding: DRAG_IMAGE_HALO + "px",
		width: (rect.width + 2 * DRAG_IMAGE_HALO) + "px",
		overflow: "hidden",
		"z-index": DRAG_IMAGE_Z_INDEX,
		"pointer-events": "none"
	});
	if(scale < 1) {
		// Zoom rather than a transform, so the copy really is that size
		forceStyles(dragImage,{
			zoom: scale,
			top: "0",
			left: "0"
		});
	} else {
		forceStyles(dragImage,{
			top: (rect.top - DRAG_IMAGE_HALO) + "px",
			left: (rect.left - DRAG_IMAGE_HALO) + "px"
		});
	}
	doc.body.appendChild(dragImage);
	return dragImage;
}

/*
Nothing in the copy may answer to the pointer, and a rule naming a descendant outright would win it back
*/
function makeDragImageStylesheet(document) {
	var style = document.createElement("style");
	style.textContent = "[" + DRAG_IMAGE_ATTRIBUTE + "],[" + DRAG_IMAGE_ATTRIBUTE + "] * { pointer-events: none !important; }";
	return style;
}

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
	var removeDragImage = function() {
		domNode.removeEventListener("drag",removeDragImage,false);
		if(dragImage && dragImage.parentNode) {
			dragImage.parentNode.removeChild(dragImage);
		}
		dragImage = null;
	};

	var setDragImage = function(event,titles) {
		var dataTransfer = event.dataTransfer;
		if(!dataTransfer.setDragImage) {
			return;
		}
		try {
			if(dragImageType === "pill" || dragImageType === "blank") {
				dragImage = createPillDragImage(options.widget.document,titles);
				if(dragImageType === "blank") {
					dragImage.removeChild(dragImage.firstChild);
					dataTransfer.setDragImage(dragImage,0,0);
				} else {
					dataTransfer.setDragImage(dragImage.firstChild,-16,-16);
				}
			} else {
				var rect = domNode.getBoundingClientRect(),
					scale = getDragImageScale(domNode,rect);
				dragImage = createDomDragImage(domNode,rect,scale);
				// The grab point sits inside the room left around the copy, and shrinks with it
				dataTransfer.setDragImage(dragImage,
					(event.clientX - rect.left + DRAG_IMAGE_HALO) * scale,
					(event.clientY - rect.top + DRAG_IMAGE_HALO) * scale);
				// Timers can be frozen mid-drag, so the drag itself says when the picture has been taken
				domNode.addEventListener("drag",removeDragImage,false);
				$tw.utils.nextTick(removeDragImage);
			}
		} catch(e) {
			// A drag is worth more than its picture
			removeDragImage();
			console.log("Error creating drag image: " + e);
		}
	};

	var dragStartHandler = function(event) {
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
			markDragInProgress(domNode,true);
			recordDrag(options.widget,titleString);
			installDragEndBackstop(domNode,options.widget,options.endActions,titleString);
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
			// Set the data transfer properties
			var dataTransfer = event.dataTransfer;
			dataTransfer.effectAllowed = "all";
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
			// If browser is Chrome-like and has a touch-input device do NOT .setData
			if(!($tw.browser.isMobileChrome)) {
				dataTransfer.setData("URL","data:text/vnd.tiddler," + encodeURIComponent(jsonData));
			}
			dataTransfer.setData("Text",titleString);
			// Last, so a drag still carries its payload if the picture cannot be taken
			setDragImage(event,titles);
			event.stopPropagation();
		}
		return false;
	};

	var dragEndHandler = function(event) {
		if((options.selector && $tw.utils.domMatchesSelector(event.target,options.selector)) || event.target === domNode) {
			// Collect the tiddlers being dragged
			var dragTiddler = options.dragTiddlerFn && options.dragTiddlerFn(),
				dragFilter = options.dragFilterFn && options.dragFilterFn(),
				titles = dragTiddler ? [dragTiddler] : [],
				endActions = options.endActions,
				startActions = options.startActions,
				variables;
			if(dragFilter) {
				titles.push.apply(titles,options.widget.wiki.filterTiddlers(dragFilter,options.widget));
			}
			var titleString = $tw.utils.stringifyList(titles);
			// Invoke drag-end actions if given
			if(endActions !== undefined) {
				variables = $tw.utils.collectDOMVariables(domNode,null,event);
				variables.modifier = $tw.keyboardManager.getEventModifierKeyDescriptor(event);
				variables["actionTiddler"] = titleString;
				options.widget.invokeActionString(endActions,options.widget,event,variables);
			}
			endDragInProgress(domNode,options.widget);
			// Remove the dragging class on the element being dragged
			$tw.utils.removeClass(domNode,"tc-dragging");
			// Delete the drag image element
			removeDragImage();
		}
		return false;
	};

	// Remove any handlers left by a previous call
	if(options.widget && domNode.removeEventListener) {
		if(options.widget.dragStartListenerReference) {
			domNode.removeEventListener("dragstart",options.widget.dragStartListenerReference,false);
		}
		if(options.widget.dragEndListenerReference) {
			domNode.removeEventListener("dragend",options.widget.dragEndListenerReference,false);
		}
	}
	// Add event handlers
	options.widget.dragStartListenerReference = dragStartHandler;
	options.widget.dragEndListenerReference = dragEndHandler;
	$tw.utils.addEventListeners(domNode,[
		{name: "dragstart", handlerFunction: dragStartHandler},
		{name: "dragend", handlerFunction: dragEndHandler}
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
				break;
			}
		}
	}
	return false;
};

exports.dragEventContainsFiles = function(event) {
	return (dragEventContainsType(event,"Files") && !dragEventContainsType(event,"text/plain"));
};

exports.dragEventContainsType = dragEventContainsType;
