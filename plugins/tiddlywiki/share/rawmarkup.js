/*\
title: $:/plugins/tiddlywiki/share/rawmarkup.js
type: application/javascript
module-type: library

Read tiddlers from the browser location hash

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Get the hash
var rawHash = document.location.hash.substring(1);
if(rawHash.charAt(0) === "#") {
	var hash;
	try{
		hash = $tw.utils.decodeURIComponentSafe(rawHash.substring(1));
	} catch(ex) {
		console.log("Share plugin: Error decoding location hash",ex);
	}
	// Try to parse the hash as JSON
	if(hash) {
		var tiddlers;
		try {
			tiddlers= JSON.parse(hash);
		} catch(ex) {
			console.log("Share plugin: Error parsing JSON from location hash",ex);
		}
		if(tiddlers) {
			// Need to initialise these because we run before bootprefix.js and boot.js
			window.$tw = window.$tw || {};
			$tw.boot = $tw.boot || {};
			$tw.preloadTiddlers = $tw.preloadTiddlers || [];
			// Prevent TiddlyWiki from booting
			$tw.boot.suppressBoot = true;
			// Load our styles
			var stylesWrapper = document.createElement("style");
			stylesWrapper.innerHTML = tiddlywikiSharePluginStartupWarningCss;
			document.documentElement.appendChild(stylesWrapper);
			// Display the warning banner
			var warningWrapper = document.createElement("div");
			warningWrapper.innerHTML = tiddlywikiSharePluginStartupWarningHtml;
			document.documentElement.appendChild(warningWrapper);
			// Add our event handlers
			document.getElementById("startup-warning-proceed").addEventListener("click",actionProceed,false);
			document.getElementById("startup-warning-cancel").addEventListener("click",actionCancel,false);
			// Sort the incoming tiddlers by title
			tiddlers = tiddlers.sort(function(a,b) {
				if(a.title < b.title) {
					return -1;
				} else if(a.title > b.title) {
					return +1;
				} else {
					return 0;
				}
			});
			// Load the tiddler preview						
			var previewWrapper = document.getElementById("startup-warning-preview");
			for(var index=0; index < tiddlers.length; index++) {
				var tiddler = tiddlers[index],
					tiddlerWrapper = document.createElement("li"),
					titleTextWrapper = document.createElement("span"),
					titleText = document.createTextNode(tiddler.title),
					fieldsTable = document.createElement("table"),
					fieldsTableBody = document.createElement("tbody");
				titleTextWrapper.appendChild(titleText);
				titleTextWrapper.className = "tiddler-title";
				tiddlerWrapper.appendChild(titleTextWrapper);
				fieldsTable.appendChild(fieldsTableBody);
				var fields = Object.keys(tiddler).sort();
				for(var fieldIndex = 0; fieldIndex < fields.length; fieldIndex++) {
					var fieldName = fields[fieldIndex],
						fieldValue = tiddler[fieldName];
					if(fieldName !== "title") {
						var fieldRow = document.createElement("tr"),
							fieldRowHeader = document.createElement("th"),
							fieldRowValue = document.createElement("td");
						fieldRowHeader.appendChild(document.createTextNode(fieldName));
						fieldRowValue.appendChild(document.createTextNode(fieldValue));
						fieldRow.appendChild(fieldRowHeader);
						fieldRow.appendChild(fieldRowValue);
						fieldsTableBody.appendChild(fieldRow);
					}
				}
				tiddlerWrapper.appendChild(fieldsTable);
				previewWrapper.appendChild(tiddlerWrapper);
			}
		}
	}
}

function actionProceed() {
	// Remove the banner, load our tiddlers, and boot TiddlyWiki
	removeWarningBanner();
	$tw.preloadTiddlers = $tw.preloadTiddlers.concat(tiddlers);
	$tw.boot.boot();
}

function actionCancel() {
	// Remove the banner, clear the location hash, and boot TiddlyWiki
	removeWarningBanner();
	document.location.hash = "#";
	$tw.boot.boot();
}

function removeWarningBanner() {
	warningWrapper.parentNode.removeChild(warningWrapper);
	stylesWrapper.parentNode.removeChild(stylesWrapper);
}

})();
