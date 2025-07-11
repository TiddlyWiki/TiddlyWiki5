/*\
title: $:/plugins/tiddlywiki/browser-sniff/sniff.js
type: application/javascript
module-type: info

Initialise $:/info/browser tiddlers

\*/

"use strict";

exports.getInfoTiddlerFields = function() {
	const mapBoolean = function(value) {return value ? "yes" : "no";};
	const infoTiddlerFields = [];
	// Basics
	if($tw.browser) {
		// Mappings from tiddler titles (prefixed with "$:/info/browser/") to bowser.browser property name
		const bowser = require("$:/plugins/tiddlywiki/browser-sniff/bowser/bowser.js");
		const mappings = [
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
			["is/firefoxos","firefoxos"],
			["is/mobile","mobile"]
		];
		$tw.browser = $tw.utils.extend($tw.browser,{
			is: bowser.browser,
		});
		$tw.utils.each(mappings,(mapping) => {
			let value = bowser.browser[mapping[1]];
			if(value === undefined) {
				value = mapping[2];
			}
			if(value === undefined) {
				value = false;
			}
			if(typeof value === "boolean") {
				value = mapBoolean(value);
			}
			infoTiddlerFields.push({title: `$:/info/browser/${mapping[0]}`,text: value});
		});
		// Set $:/info/browser/name to the platform with some changes from Bowser
		let platform = bowser.browser.name;
		if("iPad iPhone iPod".split(" ").includes(platform)) {
			platform = "iOS";
		}
		infoTiddlerFields.push({title: "$:/info/browser/name",text: platform});
		// Non-bowser settings for TiddlyFox and TiddlyDesktop
		const hasTiddlyFox = !!document.getElementById("tiddlyfox-message-box"); // Fails because message box is added after page load
		const isTiddlyDesktop = false; // Can't detect it until we update TiddlyDesktop to have a distinct useragent string
		//infoTiddlerFields.push({title: "$:/info/browser/has/tiddlyfox", text: mapBoolean(hasTiddlyFox)});
		//infoTiddlerFields.push({title: "$:/info/browser/is/tiddlydesktop", text: mapBoolean(isTiddlyDesktop)});
		if(isTiddlyDesktop) {
			infoTiddlerFields.push({title: "$:/info/browser/name",text: "TiddlyDesktop"});
		}
	}
	return infoTiddlerFields;
};
