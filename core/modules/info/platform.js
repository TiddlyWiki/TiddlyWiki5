/*\
title: $:/core/modules/info/platform.js
type: application/javascript
module-type: info

Initialise basic platform $:/info/ tiddlers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.getInfoTiddlerFields = function(updateInfoTiddlersCallback) {
	var mapBoolean = function(value) {return value ? "yes" : "no";},
		infoTiddlerFields = [];
	// Basics
	infoTiddlerFields.push({title: "$:/info/browser", text: mapBoolean(!!$tw.browser)});
	infoTiddlerFields.push({title: "$:/info/node", text: mapBoolean(!!$tw.node)});
	infoTiddlerFields.push({title: "$:/info/startup-timestamp", text: $tw.utils.stringifyDate(new Date())});
	if($tw.browser) {
		// Document location
		var setLocationProperty = function(name,value) {
				infoTiddlerFields.push({title: "$:/info/url/" + name, text: value});
			},
			location = document.location;
		setLocationProperty("full", (location.toString()).split("#")[0]);
		setLocationProperty("host", location.host);
		setLocationProperty("hostname", location.hostname);
		setLocationProperty("protocol", location.protocol);
		setLocationProperty("port", location.port);
		setLocationProperty("pathname", location.pathname);
		setLocationProperty("search", location.search);
		setLocationProperty("origin", location.origin);
		// Screen size
		infoTiddlerFields.push({title: "$:/info/browser/screen/width", text: window.screen.width.toString()});
		infoTiddlerFields.push({title: "$:/info/browser/screen/height", text: window.screen.height.toString()});
 		// Dark mode through event listener on MediaQueryList
 		var mqList = window.matchMedia("(prefers-color-scheme: dark)"),
 			getDarkModeTiddler = function() {return {title: "$:/info/darkmode", text: mqList.matches ? "yes" : "no"};};
 		infoTiddlerFields.push(getDarkModeTiddler());
 		mqList.addListener(function(event) {
 			updateInfoTiddlersCallback([getDarkModeTiddler()]);
 		});
		// Language
		infoTiddlerFields.push({title: "$:/info/browser/language", text: navigator.language || ""});
	}
	return infoTiddlerFields;
};

})();
