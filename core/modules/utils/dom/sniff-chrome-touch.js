/*\
title: $:/core/modules/utils/dom/sniff-chrome-touch.js
type: application/javascript
module-type: utils

Utility functions to detect chrome-like browsers and touch input

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.browser = {};

exports.browser.isMobileChrome = function() {
	if($tw.browser) {
		return this.hasTouch() && this.isChromeLike();
	}
	return undefined;
};

exports.browser.isChromeLike = function() {
	if($tw.browser) {
		// 2023-07-21 Edge returns UA below. So we use "isChromeLike"
		//'mozilla/5.0 (windows nt 10.0; win64; x64) applewebkit/537.36 (khtml, like gecko) chrome/114.0.0.0 safari/537.36 edg/114.0.1823.82'
		return navigator.userAgent.toLowerCase().indexOf("chrome") > -1;
	}
	return undefined;
};

exports.browser.hasTouch = function() {
	if($tw.browser) {
		return !!window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
	}
	return undefined;
};

