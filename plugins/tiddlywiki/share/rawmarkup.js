/*\
title: $:/plugins/tiddlywiki/share/rawmarkup.js
type: application/javascript
module-type: library

Read tiddlers from the browser location hash

\*/

"use strict";

// Get the hash
let hash;
try {
	hash = decodeURIComponent(document.location.hash.substring(1));
} catch(e) {}
if(hash && hash.charAt(0) === "#") {
	// Try to parse the hash as JSON
	if(hash) {
		var tiddlers;
		try {
			tiddlers = JSON.parse(hash.substr(1));
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
			tiddlers = tiddlers.sort((a,b) => {
				if(a.title < b.title) {
					return -1;
				} else if(a.title > b.title) {
					return +1;
				} else {
					return 0;
				}
			});
			// Load the tiddler preview						
			const previewWrapper = document.getElementById("startup-warning-preview");
			for(let index = 0;index < tiddlers.length;index++) {
				const tiddler = tiddlers[index];
				const tiddlerWrapper = document.createElement("li");
				const titleTextWrapper = document.createElement("span");
				const titleText = document.createTextNode(tiddler.title);
				const fieldsTable = document.createElement("table");
				const fieldsTableBody = document.createElement("tbody");
				titleTextWrapper.appendChild(titleText);
				titleTextWrapper.className = "tiddler-title";
				tiddlerWrapper.appendChild(titleTextWrapper);
				fieldsTable.appendChild(fieldsTableBody);
				const fields = Object.keys(tiddler).sort();
				for(let fieldIndex = 0;fieldIndex < fields.length;fieldIndex++) {
					const fieldName = fields[fieldIndex];
					const fieldValue = tiddler[fieldName];
					if(fieldName !== "title") {
						const fieldRow = document.createElement("tr");
						const fieldRowHeader = document.createElement("th");
						const fieldRowValue = document.createElement("td");
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
