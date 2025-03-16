/*\
title: $:/core/modules/utils/dom.js
type: application/javascript
module-type: utils

Various static DOM-related utility functions.

\*/

"use strict";

var Popup = require("$:/core/modules/utils/dom/popup.js");

/*
Determines whether element 'a' contains element 'b'
Code thanks to John Resig, http://ejohn.org/blog/comparing-document-position/
*/
exports.domContains = function(a,b) {
	return a.contains ?
		a !== b && a.contains(b) :
		!!(a.compareDocumentPosition(b) & 16);
};

exports.domMatchesSelector = function(node,selector) {
	return node.matches ? node.matches(selector) : node.msMatchesSelector(selector);
};

/*
Select text in a an input or textarea (setSelectionRange crashes on certain input types)
*/
exports.setSelectionRangeSafe = function(node,start,end,direction) {
	try {
		node.setSelectionRange(start,end,direction);
	} catch(e) {
		node.select();
	}
};

/*
Select the text in an input or textarea by position
*/
exports.setSelectionByPosition = function(node,selectFromStart,selectFromEnd) {
	$tw.utils.setSelectionRangeSafe(node,selectFromStart,node.value.length - selectFromEnd);
};

exports.removeChildren = function(node) {
	while(node.hasChildNodes()) {
		node.removeChild(node.firstChild);
	}
};

exports.hasClass = function(el,className) {
	return el && el.hasAttribute && el.hasAttribute("class") && el.getAttribute("class").split(" ").indexOf(className) !== -1;
};

exports.addClass = function(el,className) {
	var c = (el.getAttribute("class") || "").split(" ");
	if(c.indexOf(className) === -1) {
		c.push(className);
		el.setAttribute("class",c.join(" "));
	}
};

exports.removeClass = function(el,className) {
	var c = (el.getAttribute("class") || "").split(" "),
		p = c.indexOf(className);
	if(p !== -1) {
		c.splice(p,1);
		el.setAttribute("class",c.join(" "));
	}
};

exports.toggleClass = function(el,className,status) {
	if(status === undefined) {
		status = !exports.hasClass(el,className);
	}
	if(status) {
		exports.addClass(el,className);
	} else {
		exports.removeClass(el,className);
	}
};

/*
Get the first parent element that has scrollbars or use the body as fallback.
*/
exports.getScrollContainer = function(el) {
	var doc = el.ownerDocument;
	while(el.parentNode) {
		el = el.parentNode;
		if(el.scrollTop) {
			return el;
		}
	}
	return doc.body;
};

/*
Get the scroll position of the viewport
Returns:
	{
		x: horizontal scroll position in pixels,
		y: vertical scroll position in pixels
	}
*/
exports.getScrollPosition = function(srcWindow) {
	var scrollWindow = srcWindow || window;
	if("scrollX" in scrollWindow) {
		return {x: scrollWindow.scrollX, y: scrollWindow.scrollY};
	} else {
		return {x: scrollWindow.document.documentElement.scrollLeft, y: scrollWindow.document.documentElement.scrollTop};
	}
};

/*
Adjust the height of a textarea to fit its content, preserving scroll position, and return the height
*/
exports.resizeTextAreaToFit = function(domNode,minHeight) {
	// Get the scroll container and register the current scroll position
	var container = $tw.utils.getScrollContainer(domNode),
		scrollTop = container.scrollTop;
    // Measure the specified minimum height
	domNode.style.height = minHeight;
	var measuredHeight = domNode.offsetHeight || parseInt(minHeight,10);
	// Set its height to auto so that it snaps to the correct height
	domNode.style.height = "auto";
	// Calculate the revised height
	var newHeight = Math.max(domNode.scrollHeight + domNode.offsetHeight - domNode.clientHeight,measuredHeight);
	// Only try to change the height if it has changed
	if(newHeight !== domNode.offsetHeight) {
		domNode.style.height = newHeight + "px";
		// Make sure that the dimensions of the textarea are recalculated
		$tw.utils.forceLayout(domNode);
		// Set the container to the position we registered at the beginning
		container.scrollTop = scrollTop;
	}
	return newHeight;
};

/*
Gets the bounding rectangle of an element in absolute page coordinates
*/
exports.getBoundingPageRect = function(element) {
	var scrollPos = $tw.utils.getScrollPosition(element.ownerDocument.defaultView),
		clientRect = element.getBoundingClientRect();
	return {
		left: clientRect.left + scrollPos.x,
		width: clientRect.width,
		right: clientRect.right + scrollPos.x,
		top: clientRect.top + scrollPos.y,
		height: clientRect.height,
		bottom: clientRect.bottom + scrollPos.y
	};
};

/*
Saves a named password in the browser
*/
exports.savePassword = function(name,password) {
	var done = false;
	try {
		window.localStorage.setItem("tw5-password-" + name,password);
		done = true;
	} catch(e) {
	}
	if(!done) {
		$tw.savedPasswords = $tw.savedPasswords || Object.create(null);
		$tw.savedPasswords[name] = password;
	}
};

/*
Retrieve a named password from the browser
*/
exports.getPassword = function(name) {
	var value;
	try {
		value = window.localStorage.getItem("tw5-password-" + name);
	} catch(e) {
	}
	if(value !== undefined) {
		return value;
	} else {
		return ($tw.savedPasswords || Object.create(null))[name] || "";
	}
};

/*
Force layout of a dom node and its descendents
*/
exports.forceLayout = function(element) {
	var dummy = element.offsetWidth;
};

/*
Pulse an element for debugging purposes
*/
exports.pulseElement = function(element) {
	// Event handler to remove the class at the end
	element.addEventListener($tw.browser.animationEnd,function handler(event) {
		element.removeEventListener($tw.browser.animationEnd,handler,false);
		$tw.utils.removeClass(element,"pulse");
	},false);
	// Apply the pulse class
	$tw.utils.removeClass(element,"pulse");
	$tw.utils.forceLayout(element);
	$tw.utils.addClass(element,"pulse");
};

/*
Attach specified event handlers to a DOM node
domNode: where to attach the event handlers
events: array of event handlers to be added (see below)
Each entry in the events array is an object with these properties:
handlerFunction: optional event handler function
handlerObject: optional event handler object
handlerMethod: optionally specifies object handler method name (defaults to `handleEvent`)
*/
exports.addEventListeners = function(domNode,events) {
	$tw.utils.each(events,function(eventInfo) {
		var handler;
		if(eventInfo.handlerFunction) {
			handler = eventInfo.handlerFunction;
		} else if(eventInfo.handlerObject) {
			if(eventInfo.handlerMethod) {
				handler = function(event) {
					eventInfo.handlerObject[eventInfo.handlerMethod].call(eventInfo.handlerObject,event);
				};
			} else {
				handler = eventInfo.handlerObject;
			}
		}
		domNode.addEventListener(eventInfo.name,handler,false);
	});
};

/*
Get the computed styles applied to an element as an array of strings of individual CSS properties
*/
exports.getComputedStyles = function(domNode) {
	var textAreaStyles = window.getComputedStyle(domNode,null),
		styleDefs = [],
		name;
	for(var t=0; t<textAreaStyles.length; t++) {
		name = textAreaStyles[t];
		styleDefs.push(name + ": " + textAreaStyles.getPropertyValue(name) + ";");
	}
	return styleDefs;
};

/*
Apply a set of styles passed as an array of strings of individual CSS properties
*/
exports.setStyles = function(domNode,styleDefs) {
	domNode.style.cssText = styleDefs.join("");
};

/*
Copy the computed styles from a source element to a destination element
*/
exports.copyStyles = function(srcDomNode,dstDomNode) {
	$tw.utils.setStyles(dstDomNode,$tw.utils.getComputedStyles(srcDomNode));
};

/*
Copy plain text to the clipboard on browsers that support it
*/
exports.copyToClipboard = function(text,options,type) {
	var text = text || "";
	var options = options || {};
	var type = type || "text/plain";
	var textArea = document.createElement("textarea");
	textArea.style.position = "fixed";
	textArea.style.top = 0;
	textArea.style.left = 0;
	textArea.style.fontSize = "12pt";
	textArea.style.width = "2em";
	textArea.style.height = "2em";
	textArea.style.padding = 0;
	textArea.style.border = "none";
	textArea.style.outline = "none";
	textArea.style.boxShadow = "none";
	textArea.style.background = "transparent";
	document.body.appendChild(textArea);
	textArea.select();
	textArea.setSelectionRange(0,text.length);
	textArea.addEventListener("copy",function(event) {
		event.preventDefault();
		if (options.plainText) {
			event.clipboardData.setData("text/plain",options.plainText);
		}
		event.clipboardData.setData(type,text);
	});
	var succeeded = false;
	try {
		succeeded = document.execCommand("copy");
	} catch(err) {
	}
	if(!options.doNotNotify) {
		var successNotification = options.successNotification || "$:/language/Notifications/CopiedToClipboard/Succeeded",
			failureNotification = options.failureNotification || "$:/language/Notifications/CopiedToClipboard/Failed"
		$tw.notifier.display(succeeded ? successNotification : failureNotification);
	}
	document.body.removeChild(textArea);
};

exports.getLocationPath = function() {
	return window.location.toString().split("#")[0];
};

/*
Collect DOM variables
*/
exports.collectDOMVariables = function(selectedNode,domNode,event) {
	var variables = {},
	    selectedNodeRect,
	    domNodeRect;
	if(selectedNode) {
		$tw.utils.each(selectedNode.attributes,function(attribute) {
			variables["dom-" + attribute.name] = attribute.value.toString();
		});
		
		if("offsetLeft" in selectedNode) {
			// Add variables with a (relative and absolute) popup coordinate string for the selected node
			var nodeRect = {
				left: selectedNode.offsetLeft,
				top: selectedNode.offsetTop,
				width: selectedNode.offsetWidth,
				height: selectedNode.offsetHeight
			};
			variables["tv-popup-coords"] = Popup.buildCoordinates(Popup.coordinatePrefix.csOffsetParent,nodeRect);

			var absRect = $tw.utils.extend({}, nodeRect);
			for(var currentNode = selectedNode.offsetParent; currentNode; currentNode = currentNode.offsetParent) {
				absRect.left += currentNode.offsetLeft;
				absRect.top += currentNode.offsetTop;
			}
			variables["tv-popup-abs-coords"] = Popup.buildCoordinates(Popup.coordinatePrefix.csAbsolute,absRect);

			// Add variables for offset of selected node
			variables["tv-selectednode-posx"] = selectedNode.offsetLeft.toString();
			variables["tv-selectednode-posy"] = selectedNode.offsetTop.toString();
			variables["tv-selectednode-width"] = selectedNode.offsetWidth.toString();
			variables["tv-selectednode-height"] = selectedNode.offsetHeight.toString();
		}
	}
	
	if(domNode && ("offsetWidth" in domNode)) {
		variables["tv-widgetnode-width"] = domNode.offsetWidth.toString();
		variables["tv-widgetnode-height"] = domNode.offsetHeight.toString();
	}

	if(event && ("clientX" in event) && ("clientY" in event)) {
		if(selectedNode) {
			// Add variables for event X and Y position relative to selected node
			selectedNodeRect = selectedNode.getBoundingClientRect();
			variables["event-fromselected-posx"] = (event.clientX - selectedNodeRect.left).toString();
			variables["event-fromselected-posy"] = (event.clientY - selectedNodeRect.top).toString();
		}
		
		if(domNode) {
			// Add variables for event X and Y position relative to event catcher node
			domNodeRect = domNode.getBoundingClientRect();
			variables["event-fromcatcher-posx"] = (event.clientX - domNodeRect.left).toString();
			variables["event-fromcatcher-posy"] = (event.clientY - domNodeRect.top).toString();
		}

		// Add variables for event X and Y position relative to the viewport
		variables["event-fromviewport-posx"] = event.clientX.toString();
		variables["event-fromviewport-posy"] = event.clientY.toString();
	}
	return variables;
};

/*
Make sure the CSS selector is not invalid
*/
exports.querySelectorSafe = function(selector,baseElement) {
	baseElement = baseElement || document;
	try {
		return baseElement.querySelector(selector);
	} catch(e) {
		console.log("Invalid selector: ",selector);
	}
};

exports.querySelectorAllSafe = function(selector,baseElement) {
	baseElement = baseElement || document;
	try {
		return baseElement.querySelectorAll(selector);
	} catch(e) {
		console.log("Invalid selector: ",selector);
	}
};
