/*\
title: $:/core/modules/utils.dom.js
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
		a != b && a.contains(b) :
		!!(a.compareDocumentPosition(b) & 16);
};

exports.hasClass = function(el,className) {
	return el.className.split(" ").indexOf(className) !== -1;
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
Smoothly scroll an element back into view if needed
*/
exports.scrollIntoView = function(element) {
	var slowInSlowOut = function(t) {
			return (1 - ((Math.cos(t * Math.PI) + 1) / 2));
		},
		animateScroll = function(startX,startY,endX,endY,duration) {
			var startTime = new Date(),
				timerId = window.setInterval(function() {
					var t = ((new Date()) - startTime) / duration;
					if(t >= 1) {
						window.clearInterval(timerId);
						t = 1;
					}
					t = slowInSlowOut(t);
					var x = startX + (endX - startX) * t,
						y = startY + (endY - startY) * t;
					window.scrollTo(x,y);
				}, 10);
		},
		x = element.offsetLeft,
		y = element.offsetTop,
		winWidth = window.innerWidth,
		winHeight = window.innerHeight,
		scrollLeft = window.scrollX || document.documentElement.scrollLeft,
		scrollTop = window.scrollY || document.documentElement.scrollTop;
	if((x < scrollLeft) || (x > (scrollLeft + winWidth)) || (y < scrollTop) || (y > (scrollTop + winHeight))) {
		animateScroll(scrollLeft,scrollTop,x,y,$tw.config.preferences.animationDuration);
	}
};

})();
