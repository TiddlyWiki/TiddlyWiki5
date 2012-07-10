/*\
title: $:/core/modules/savers/firefox.js
type: application/javascript
module-type: saver

Handles saving changes via Firefox's XUL APIs

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var FirefoxSaver = function() {
};

FirefoxSaver.prototype.save = function(text) {
	try {
		netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
		// Generate the local file path from the file URI
		var url = document.location.toString(),
			ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService),
			fileHandler = ioService.getProtocolHandler("file").QueryInterface(Components.interfaces.nsIFileProtocolHandler),
			fileSpec = fileHandler.getFileFromURLSpec(url);
console.log("Saving to",fileSpec.path);
		// Try to save the file
		var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
		file.initWithPath(fileSpec.path);
		if(!file.exists()) {
			file.create(0,0x01B4);// 0x01B4 = 0664
		}
		var out = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
		out.init(file,0x22,0x04,null);
		var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].createInstance(Components.interfaces.nsIConverterOutputStream);
		converter.init(out, "UTF-8", 0, 0);
		converter.writeString(text);
		converter.close();
		return true;
	} catch(ex) {
		return false;
	}
};

/*
Information about this saver
*/
FirefoxSaver.prototype.info = {
	name: "firefox",
	priority: 1000
};

/*
Static method that returns true if this saver is capable of working
*/
exports.canSave = function() {
	return !!window.Components;
};

/*
Create an instance of this saver
*/
exports.create = function() {
	return new FirefoxSaver();
};

})();
