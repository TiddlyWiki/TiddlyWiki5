/*\
title: $:/core/modules/utils/dom/browser.js
type: application/javascript
module-type: utils

Browser feature detection

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Set style properties of an element
	element: dom node
	styles: ordered array of {name: value} pairs
*/
exports.setStyle = function(element,styles) {
	if(element.nodeType === 1) { // Element.ELEMENT_NODE
		for(var t=0; t<styles.length; t++) {
			for(var styleName in styles[t]) {
				element.style[$tw.utils.convertStyleNameToPropertyName(styleName)] = styles[t][styleName];
			}
		}
	}
};

/*
Converts a standard CSS property name into the local browser-specific equivalent. For example:
	"background-color" --> "backgroundColor"
	"transition" --> "webkitTransition"
*/

var styleNameCache = {}; // We'll cache the style name conversions

exports.convertStyleNameToPropertyName = function(styleName) {
	// Return from the cache if we can
	if(styleNameCache[styleName]) {
		return styleNameCache[styleName];
	}
	// Convert it by first removing any hyphens
	var propertyName = $tw.utils.unHyphenateCss(styleName);
	// Then check if it needs a prefix
	if(document.body.style[propertyName] === undefined) {
		var prefixes = ["O","MS","Moz","webkit"];
		for(var t=0; t<prefixes.length; t++) {
			var prefixedName = prefixes[t] + propertyName.substr(0,1).toUpperCase() + propertyName.substr(1);
			if(document.body.style[prefixedName] !== undefined) {
				propertyName = prefixedName;
				break;
			}
		}
	}
	// Put it in the cache too
	styleNameCache[styleName] = propertyName;
	return propertyName;
};

/*
Converts a JS format CSS property name back into the dashed form used in CSS declarations. For example:
	"backgroundColor" --> "background-color"
	"webkitTransform" --> "-webkit-transform"
*/
exports.convertPropertyNameToStyleName = function(propertyName) {
	// Rehyphenate the name
	var styleName = $tw.utils.hyphenateCss(propertyName);
	// If there's a webkit prefix, add a dash (other browsers have uppercase prefixes, and so get the dash automatically)
	if(styleName.indexOf("webkit") === 0) {
		styleName = "-" + styleName;
	} else if(styleName.indexOf("-m-s") === 0) {
		styleName = "-ms" + styleName.substr(4);
	}
	return styleName;
};

/*
Round trip a stylename to a property name and back again. For example:
	"transform" --> "webkitTransform" --> "-webkit-transform"
*/
exports.roundTripPropertyName = function(propertyName) {
	return $tw.utils.convertPropertyNameToStyleName($tw.utils.convertStyleNameToPropertyName(propertyName));
};

/*
Converts a standard event name into the local browser specific equivalent. For example:
	"animationEnd" --> "webkitAnimationEnd"
*/

var eventNameCache = {}; // We'll cache the conversions

var eventNameMappings = {
	"transitionEnd": {
		correspondingCssProperty: "transition",
		mappings: {
			transition: "transitionend",
			OTransition: "oTransitionEnd",
			MSTransition: "msTransitionEnd",
			MozTransition: "transitionend",
			webkitTransition: "webkitTransitionEnd"
		}
	},
	"animationEnd": {
		correspondingCssProperty: "animation",
		mappings: {
			animation: "animationend",
			OAnimation: "oAnimationEnd",
			MSAnimation: "msAnimationEnd",
			MozAnimation: "animationend",
			webkitAnimation: "webkitAnimationEnd"
		}
	}
};

exports.convertEventName = function(eventName) {
	if(eventNameCache[eventName]) {
		return eventNameCache[eventName];
	}
	var newEventName = eventName,
		mappings = eventNameMappings[eventName];
	if(mappings) {
		var convertedProperty = $tw.utils.convertStyleNameToPropertyName(mappings.correspondingCssProperty);
		if(mappings.mappings[convertedProperty]) {
			newEventName = mappings.mappings[convertedProperty];
		}
	}
	// Put it in the cache too
	eventNameCache[eventName] = newEventName;
	return newEventName;
};

/*
Return the names of the fullscreen APIs
*/
exports.getFullScreenApis = function() {
	var d = document,
		db = d.body;
	return {
		"_requestFullscreen": db.webkitRequestFullscreen !== undefined ? "webkitRequestFullscreen" :
							db.mozRequestFullScreen !== undefined ? "mozRequestFullScreen" :
							db.msRequestFullscreen !== undefined ? "msRequestFullscreen" :
							db.requestFullscreen !== undefined ? "requestFullscreen" : "",
		"_exitFullscreen": d.webkitExitFullscreen !== undefined ? "webkitExitFullscreen" :
							d.mozCancelFullScreen !== undefined ? "mozCancelFullScreen" :
							d.msExitFullscreen !== undefined ? "msExitFullscreen" :
							d.exitFullscreen !== undefined ? "exitFullscreen" : "",
		"_fullscreenElement": d.webkitFullscreenElement !== undefined ? "webkitFullscreenElement" :
							d.mozFullScreenElement !== undefined ? "mozFullScreenElement" :
							d.msFullscreenElement !== undefined ? "msFullscreenElement" :
							d.fullscreenElement !== undefined ? "fullscreenElement" : ""
	};
};

})();
