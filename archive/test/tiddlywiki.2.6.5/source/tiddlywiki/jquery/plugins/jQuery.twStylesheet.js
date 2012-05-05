/*
jQuery.twStylesheet.js

jQuery plugin to dynamically insert CSS rules into a document

Usage:
  jQuery.twStylesheet applies style definitions
  jQuery.twStylesheet.remove neutralizes style definitions

Copyright (c) UnaMesa Association 2009

Triple licensed under the BSD, MIT and GPL licenses:
  http://www.opensource.org/licenses/bsd-license.php
  http://www.opensource.org/licenses/mit-license.php
  http://www.gnu.org/licenses/gpl.html
*/

(function($) {

var defaultId = "customStyleSheet"; // XXX: rename to dynamicStyleSheet?

// Add or replace a style sheet
// css argument is a string of CSS rule sets
// options.id is an optional name identifying the style sheet
// options.doc is an optional document reference
// N.B.: Uses DOM methods instead of jQuery to ensure cross-browser comaptibility.
$.twStylesheet = function(css, options) {
	options = options || {};
	var id = options.id || defaultId;
	var doc = options.doc || document;
	var el = doc.getElementById(id);
	if(doc.createStyleSheet) { // IE-specific handling
		if(el) {
			el.parentNode.removeChild(el);
		}
		doc.getElementsByTagName("head")[0].insertAdjacentHTML("beforeEnd",
			'&nbsp;<style id="' + id + '" type="text/css">' + css + '</style>'); // fails without &nbsp;
	} else { // modern browsers
		if(el) {
			el.replaceChild(doc.createTextNode(css), el.firstChild);
		} else {
			el = doc.createElement("style");
			el.type = "text/css";
			el.id = id;
			el.appendChild(doc.createTextNode(css));
			doc.getElementsByTagName("head")[0].appendChild(el);
		}
	}
};

// Remove existing style sheet
// options.id is an optional name identifying the style sheet
// options.doc is an optional document reference
$.twStylesheet.remove = function(options) {
	options = options || {};
	var id = options.id || defaultId;
	var doc = options.doc || document;
	var el = doc.getElementById(id);
	if(el) {
		el.parentNode.removeChild(el);
	}
};

})(jQuery);
