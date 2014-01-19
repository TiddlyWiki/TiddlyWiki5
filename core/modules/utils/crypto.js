/*\
title: $:/core/modules/utils/crypto.js
type: application/javascript
module-type: utils

Utility functions related to crypto.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Look for an encrypted store area in the text of a TiddlyWiki file
*/
exports.extractEncryptedStoreArea = function(text) {
	var encryptedStoreAreaStartMarker = "<pre id=\"encryptedStoreArea\" type=\"text/plain\" style=\"display:none;\">",
		encryptedStoreAreaStart = text.indexOf(encryptedStoreAreaStartMarker);
	if(encryptedStoreAreaStart !== -1) {
		var encryptedStoreAreaEnd = text.indexOf("</pre>",encryptedStoreAreaStart);
		if(encryptedStoreAreaEnd !== -1) {
			return $tw.utils.htmlDecode(text.substring(encryptedStoreAreaStart + encryptedStoreAreaStartMarker.length,encryptedStoreAreaEnd-1));
		}
	}
	return null;
};

/*
Attempt to extract the tiddlers from an encrypted store area using the current password
*/
exports.decryptStoreArea = function(encryptedStoreArea) {
	var decryptedText = $tw.crypto.decrypt(encryptedStoreArea);
	if(decryptedText) {
		var json = JSON.parse(decryptedText),
			tiddlers = [];
		for(var title in json) {
			tiddlers.push(json[title]);
		}
		return tiddlers;
	} else {
		return null;
	}
};

exports.decryptStoreAreaInteractive = function(encryptedStoreArea,callback) {
	// Try to decrypt with the current password
	var tiddlers = $tw.utils.decryptStoreArea(encryptedStoreArea);
	if(tiddlers) {
		callback(tiddlers);
	} else {
		// Prompt for a new password and keep trying
		$tw.passwordPrompt.createPrompt({
			serviceName: "Enter a password to decrypt the imported TiddlyWiki",
			noUserName: true,
			canCancel: true,
			submitText: "Decrypt",
			callback: function(data) {
				// Exit if the user cancelled
				if(!data) {
					return false;
				}
				// Attempt to decrypt the tiddlers
				$tw.crypto.setPassword(data.password);
				var tiddlers = $tw.utils.decryptStoreArea(encryptedStoreArea);
				if(tiddlers) {
					callback(tiddlers);
					// Exit and remove the password prompt
					return true;
				} else {
					// We didn't decrypt everything, so continue to prompt for password
					return false;
				}
			}
		});
	}
};

})();
