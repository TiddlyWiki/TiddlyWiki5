/*\
title: $:/core/modules/utils/dom.js
type: application/javascript
module-type: utils

Various static DOM-related utility functions.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Determines whether element 'a' contains element 'b'
Code thanks to John Resig, http://ejohn.org/blog/comparing-document-position/
*/
exports.domContains = function(a,b) {
	return a.contains ?
		a !== b && a.contains(b) :
		!!(a.compareDocumentPosition(b) & 16);
};

exports.removeChildren = function(node) {
	while(node.hasChildNodes()) {
		node.removeChild(node.firstChild);
	}
};

exports.hasClass = function(el,className) {
	return el && el.className && el.className.split(" ").indexOf(className) !== -1;
};

exports.addClass = function(el,className) {
	var c = el.className.split(" ");
	if(c.indexOf(className) === -1) {
		c.push(className);
	}
	el.className = c.join(" ");
};

exports.removeClass = function(el,className) {
	var c = el.className.split(" "),
		p = c.indexOf(className);
	if(p !== -1) {
		c.splice(p,1);
		el.className = c.join(" ");
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

exports.applyStyleSheet = function(id,css) {
	var el = document.getElementById(id);
	if(document.createStyleSheet) { // Older versions of IE
		if(el) {
			el.parentNode.removeChild(el);
		}
		document.getElementsByTagName("head")[0].insertAdjacentHTML("beforeEnd",
			'&nbsp;<style id="' + id + '" type="text/css">' + css + '</style>'); // fails without &nbsp;
	} else { // Modern browsers
		if(el) {
			el.replaceChild(document.createTextNode(css), el.firstChild);
		} else {
			el = document.createElement("style");
			el.type = "text/css";
			el.id = id;
			el.appendChild(document.createTextNode(css));
			document.getElementsByTagName("head")[0].appendChild(el);
		}
	}
};

/*
Get the scroll position of the viewport
Returns:
	{
		x: horizontal scroll position in pixels,
		y: vertical scroll position in pixels
	}
*/
exports.getScrollPosition = function() {
	if("scrollX" in window) {
		return {x: window.scrollX, y: window.scrollY};
	} else {
		return {x: document.documentElement.scrollLeft, y: document.documentElement.scrollTop};
	}
};

/*
Gets the bounding rectangle of an element in absolute page coordinates
*/
exports.getBoundingPageRect = function(element) {
	var scrollPos = $tw.utils.getScrollPosition(),
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
	if(window.localStorage) {
		localStorage.setItem("tw5-password-" + name,password);
	}
};

/*
Retrieve a named password from the browser
*/
exports.getPassword = function(name) {
	return window.localStorage ? localStorage.getItem("tw5-password-" + name) : "";
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
Construct and dispatch a custom event
*/
exports.dispatchCustomEvent = function(target,name,members) {
	var event = document.createEvent("Event");
	event.initEvent(name,true,true);
	$tw.utils.each(members,function(member,name) {
		event[name] = member;
	});
	target.dispatchEvent(event); 
};


})();
