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

exports.getBrowserInfo = function(info) {
	info.unHyphenateCss = document.body.style["background-color"] === undefined;
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
};

})();
