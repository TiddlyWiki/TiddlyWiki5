/*\
title: $:/plugins/tiddlywiki/tahoelafs/saver.js
type: application/javascript
module-type: saver

A bare bones saver for Tahoe-LAFS. It just PUTs the new HTML file back to the server at the same URL.

\*/

"use strict";

/*
Select the appropriate saver module and set it up
*/
var TahoeSaver = function(wiki) {
	this.wiki = wiki;
};

TahoeSaver.prototype.save = function(text) {
	// Do the HTTP post
	var http = new XMLHttpRequest();
	http.open("PUT",document.location.toString(),true);
	http.onreadystatechange = function() {
		if(http.readyState == 4 && http.status == 200) {
			window.alert("Saved to Tahoe-LAFS: " + http.responseText);
		}
	};
	http.send(text);
	return true;
};

/*
Information about this saver
*/
TahoeSaver.prototype.info = {
	name: "tahoelafs",
	priority: 1000
};

/*
Static method that returns true if this saver is capable of working
*/
exports.canSave = function(wiki) {
	return true;
};

/*
Create an instance of this saver
*/
exports.create = function(wiki) {
	return new TahoeSaver(wiki);
};
