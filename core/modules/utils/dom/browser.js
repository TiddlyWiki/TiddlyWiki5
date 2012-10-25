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

};

/*
Converts a standard CSS property name into the local browser-specific equivalent. For example:
	"background-color" --> "backgroundColor"
	"transition" --> "webkitTransition"
*/

var styleNameCache = {}; // We'll cache the style name conversions

exports.convertStyleName = function(styleName) {
	// Return from the cache if we can
	if(styleNameCache[styleName]) {
		return styleNameCache[styleName];
	}
	// Convert it by first removing any hyphens
	var newStyleName = $tw.utils.unHyphenateCss(styleName);
	// Then check if it needs a prefix
	if(document.body.style[newStyleName] === undefined) {
		var prefixes = ["O","MS","Moz","webkit"];
		for(var t=0; t<prefixes.length; t++) {
			var prefixedName = prefixes[t] + newStyleName.substr(0,1).toUpperCase() + newStyleName.substr(1);
			if(document.body.style[prefixedName] !== undefined) {
				newStyleName = prefixedName;
				break;
			}
		}
	}
	// Put it in the cache too
	styleNameCache[styleName] = newStyleName
	return newStyleName;
}

/*
Converts a standard event name into the local browser specific equivalent. For example:
	"animationEnd" --> "webkitAnimationEnd"
*/

var eventNameCache = {}; // We'll cache the conversions

var eventNameMappings = {
	"transitionEnd": {
		correspondingCssProperty: "transition",
		mappings: {
			transition: "transitionEnd",
			OTransition: "oTransitionEnd",
			MSTransition: "msTransitionEnd",
			MozTransition: "transitionEnd",
			webkitTransition: "webkitTransitionEnd"
		}
	},
	"animationEnd": {
		correspondingCssProperty: "animation",
		mappings: {
			animation: "animationEnd",
			OAnimation: "oAnimationEnd",
			MSAnimation: "msAnimationEnd",
			MozAnimation: "animationEnd",
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
		var convertedProperty = $tw.utils.convertStyleName(mappings.correspondingCssProperty);
		if(mappings.mappings[convertedProperty]) {
			newEventName = mappings.mappings[convertedProperty];
		}
	}
	// Put it in the cache too
	eventNameCache[eventName] = newEventName
	return newEventName;
};

// For backwards compatibility, this will all be removed 
var getBrowserInfo = function(info) {
	info.prefix = document.body.style.webkitTransform !== undefined ? "webkit" : 
						document.body.style.MozTransform !== undefined ? "Moz" :
						document.body.style.MSTransform !== undefined ? "MS" :
						document.body.style.OTransform !== undefined ? "O" : "";
	info.transition = info.prefix + "Transition";
	info.transform = info.prefix + "Transform";
	info.transformorigin = info.prefix + "TransformOrigin";
	info.transitionEnd = {		
				"": "transitionEnd",
				"O": "oTransitionEnd",
				"MS": "msTransitionEnd",
				"Moz": "transitionend",
				"webkit": "webkitTransitionEnd"
			}[info.prefix];
	info.animationEnd = {		
				"": "animationEnd",
				"O": "oAnimationEnd",
				"MS": "msAnimationEnd",
				"Moz": "animationend",
				"webkit": "webkitAnimationEnd"
			}[info.prefix];
	info.requestFullScreen = document.body.webkitRequestFullScreen !== undefined ? "webkitRequestFullScreen" :
							document.body.mozRequestFullScreen !== undefined ? "mozRequestFullScreen" :
							document.body.requestFullScreen !== undefined ? "requestFullScreen" : "";
	info.cancelFullScreen = document.webkitCancelFullScreen !== undefined ? "webkitCancelFullScreen" :
							document.mozCancelFullScreen !== undefined ? "mozCancelFullScreen" :
							document.cancelFullScreen !== undefined ? "cancelFullScreen" : "";
	info.isFullScreen = document.webkitIsFullScreen !== undefined ? "webkitIsFullScreen" :
							document.mozFullScreen !== undefined ? "mozFullScreen" :
							document.fullScreen !== undefined ? "fullScreen" : "";
};

if($tw.browser) {
	getBrowserInfo($tw.browser);
}

})();
