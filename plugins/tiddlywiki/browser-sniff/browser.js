/*\
title: $:/plugins/tiddlywiki/browser-sniff/sniff.js
type: application/javascript
module-type: info

Initialise $:/info/browser tiddlers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.getInfoTiddlerFields = function() {
	var mapBoolean = function(value) {return value ? "yes" : "no"},
		infoTiddlerFields = [];
	// Basics
	if($tw.browser) {
		// Mappings from tiddler titles (prefixed with "$:/info/browser/") to bowser.browser property name
		var bowser = require("$:/plugins/tiddlywiki/browser-sniff/bowser/bowser.js"),
			mappings = [
				["name","name","unknown"],
				["version","version"],
				["is/webkit","webkit"],
				["is/gecko","gecko"],
				["is/chrome","chrome"],
				["is/firefox","firefox"],
				["is/ios","ios"],
				["is/iphone","iphone"],
				["is/ipad","ipad"],
				["is/ipod","ios"],
				["is/opera","opera"],
				["is/phantomjs","phantomjs"],
				["is/safari","safari"],
				["is/seamonkey","seamonkey"],
				["is/blackberry","blackberry"],
				["is/webos","webos"],
				["is/silk","silk"],
				["is/bada","bada"],
				["is/tizen","tizen"],
				["is/sailfish","sailfish"],
				["is/android","android"],
				["is/windowsphone","windowsphone"],
				["is/firefoxos","firefoxos"]
			];
		$tw.utils.each(mappings,function(mapping) {
			var value = bowser.browser[mapping[1]];
			if(value === undefined) {
				value = mapping[2];
			}
			if(value === undefined) {
				value = false;
			}
			if(typeof value === "boolean") {
				value = mapBoolean(value);
			}
			infoTiddlerFields.push({title: "$:/info/browser/" + mapping[0], text: value});
		});
		// Set $:/info/browser/name to the platform with some changes from Bowser
		var platform = bowser.browser.name;
		if("iPad iPhone iPod".split(" ").indexOf(platform) !== -1) {
			platform = "iOS";
		}
		infoTiddlerFields.push({title: "$:/info/browser/name", text: platform});
		// Non-bowser settings for TiddlyFox and TiddlyDesktop
		var hasTiddlyFox = !!document.getElementById("tiddlyfox-message-box"),
			isTiddlyDesktop = false; // Can't detect it until we update TiddlyDesktop to have a distinct useragent string
		infoTiddlerFields.push({title: "$:/info/browser/has/tiddlyfox", text: mapBoolean(hasTiddlyFox)});
		infoTiddlerFields.push({title: "$:/info/browser/is/tiddlydesktop", text: mapBoolean(isTiddlyDesktop)});
		if(isTiddlyDesktop) {
			infoTiddlerFields.push({title: "$:/info/browser/name", text: "TiddlyDesktop"});
		}
	}
	return infoTiddlerFields;
};

})();
