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

})();
