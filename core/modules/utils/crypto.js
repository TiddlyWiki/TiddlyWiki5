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
Attempt to extract the tiddlers from an encrypted store area using the current password. If the password is not provided then the password in the password store will be used
*/
exports.decryptStoreArea = function(encryptedStoreArea,password) {
	var decryptedText = $tw.crypto.decrypt(encryptedStoreArea,password);
	if(decryptedText) {
		var json = JSON.parse(decryptedText),
			tiddlers = [];
		for(var title in json) {
			if(title !== "$:/isEncrypted") {
				tiddlers.push(json[title]);
			}
		}
		return tiddlers;
	} else {
		return null;
	}
};


/*
Attempt to extract the tiddlers from an encrypted store area using the current password. If that fails, the user is prompted for a password.
encryptedStoreArea: text of the TiddlyWiki encrypted store area
callback: function(tiddlers) called with the array of decrypted tiddlers

The following configuration settings are supported:

$tw.config.usePasswordVault: causes any password entered by the user to also be put into the system password vault
*/
exports.decryptStoreAreaInteractive = function(encryptedStoreArea,callback,options) {
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
				var tiddlers = $tw.utils.decryptStoreArea(encryptedStoreArea,data.password);
				if(tiddlers) {
					if($tw.config.usePasswordVault) {
						$tw.crypto.setPassword(data.password);
					}
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
