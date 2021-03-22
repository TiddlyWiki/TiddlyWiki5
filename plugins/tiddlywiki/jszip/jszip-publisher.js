/*\
title: $:/plugins/tiddlywiki/jszip/jszip-publisher.js
type: application/javascript
module-type: publisher

Handles publishing to a ZIP file

\*/
(function(){

if(module.setStringHandler) {
	module.setStringHandler(function(name,language) {
		switch(name) {
			case "ui":
				return "User interface of the JSZip publisher\n\nOutput filename: <$edit-text field=jszip-output-filename/>";
		}
		return null;
	});
}

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "jszip";

var JSZip = require("$:/plugins/tiddlywiki/jszip/jszip.js");

exports.create = function(params) {
	return new JSZipPublisher(params);
};

function JSZipPublisher(params) {
	this.params = params;
	this.zip =  new JSZip();
	console.log("JSZipPublisher",params);
};

JSZipPublisher.prototype.publishStart = function(callback) {
	console.log("publishStart");
	callback([]);
};

JSZipPublisher.prototype.publishFile = function(item,callback) {
	this.zip.file(item.path,item.text);
	callback();
};

JSZipPublisher.prototype.publishEnd = function(callback) {
	var data = this.zip.generate({type: "base64"}),
		link = document.createElement("a");
	link.setAttribute("href","data:application/zip;base64," + encodeURIComponent(data));
	link.setAttribute("download",this.params["jszip-output-filename"] || "site.zip");
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	callback();
};

})();
