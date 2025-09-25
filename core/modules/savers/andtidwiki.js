/*\
title: $:/core/modules/savers/andtidwiki.js
type: application/javascript
module-type: saver

Handles saving changes via the AndTidWiki Android app

\*/


"use strict";

var AndTidWiki = function(wiki) {
};

AndTidWiki.prototype.save = function(text,method,callback,options) {
	var filename = options && options.variables ? options.variables.filename : null;
	if (method === "download") {
		// Support download
		if (window.twi.saveDownload) {
			try {
				window.twi.saveDownload(text,filename);
			} catch(err) {
				if (err.message === "Method not found") {
					window.twi.saveDownload(text);
				}
			}
		} else {
			var link = document.createElement("a");
			link.setAttribute("href","data:text/plain," + encodeURIComponent(text));
			if (filename) {
			    link.setAttribute("download",filename);
			}
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	} else if (window.twi.saveWiki) {
		// Direct save in Tiddloid
		window.twi.saveWiki(text);
	} else {
		// Get the pathname of this document
		var pathname = $tw.utils.decodeURIComponentSafe(document.location.toString().split("#")[0]);
		// Strip the file://
		if(pathname.indexOf("file://") === 0) {
			pathname = pathname.substr(7);
		}
		// Strip any query or location part
		var p = pathname.indexOf("?");
		if(p !== -1) {
			pathname = pathname.substr(0,p);
		}
		p = pathname.indexOf("#");
		if(p !== -1) {
			pathname = pathname.substr(0,p);
		}
		// Save the file
		window.twi.saveFile(pathname,text);
	}
	// Call the callback
	callback(null);
	return true;
};

/*
Information about this saver
*/
AndTidWiki.prototype.info = {
	name: "andtidwiki",
	priority: 1600,
	capabilities: ["save", "autosave", "download"]
};

/*
Static method that returns true if this saver is capable of working
*/
exports.canSave = function(wiki) {
	return !!window.twi && !!window.twi.saveFile;
};

/*
Create an instance of this saver
*/
exports.create = function(wiki) {
	return new AndTidWiki(wiki);
};
