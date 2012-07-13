/*\
title: $:/core/modules/savers/upload.js
type: application/javascript
module-type: saver

Handles saving changes via upload to a server.

Designed to be compatible with BidiX's UploadPlugin at http://tiddlywiki.bidix.info/#UploadPlugin

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Select the appropriate saver module and set it up
*/
var UploadSaver = function(wiki) {
	this.wiki = wiki;
};

UploadSaver.prototype.save = function(text) {
	// Get the various parameters we need
	var backupDir = ".",
		userName = this.wiki.getTextReference("$:/UploadName"),
		password = $tw.utils.getPassword("upload"),
		uploadDir = ".",
		url = this.wiki.getTextReference("$:/UploadURL");
	// Bail out if we don't have the bits we need
	if(!userName || userName.toString().trim() === "" || !password || password.toString().trim() === "") {
		return false;
	}
	// Construct the url if not provided
	if(!url) {
		url = "http://" + userName + ".tiddlyspot.com/store.cgi";
	}
	// Assemble the header
	var boundary = "---------------------------" + "AaB03x";	
	var uploadFormName = "UploadPlugin";
	var head = [];
	head.push("--" + boundary + "\r\nContent-disposition: form-data; name=\"UploadPlugin\"\r\n");
	head.push("backupDir=" + backupDir + ";user=" + userName + ";password=" + password + ";uploaddir=" + uploadDir + ";;"); 
	head.push("\r\n" + "--" + boundary);
	head.push("Content-disposition: form-data; name=\"userfile\"; filename=\"index.html\"");
	head.push("Content-Type: text/html;charset=UTF-8");
	head.push("Content-Length: " + text.length + "\r\n");
	head.push("");
	// Assemble the tail and the data itself
	var tail = "\r\n--" + boundary + "--\r\n",
		data = head.join("\r\n") + text + tail;
	// Do the HTTP post
	var http = new XMLHttpRequest();
	http.open("POST",url,true,userName,password);
	http.setRequestHeader("Content-Type","multipart/form-data; ;charset=UTF-8; boundary=" + boundary);
	http.onreadystatechange = function() {
		if(http.readyState == 4 && http.status == 200) {
			alert(http.responseText);
		}
	}
	http.send(data);
	return true;
};

/*
Information about this saver
*/
UploadSaver.prototype.info = {
	name: "upload",
	priority: 500
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
	return new UploadSaver(wiki);
};

})();
