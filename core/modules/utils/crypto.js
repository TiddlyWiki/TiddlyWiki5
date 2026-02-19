/*\
title: $:/core/modules/utils/crypto.js
type: application/javascript
module-type: utils
\*/

"use strict";

exports.extractEncryptedStoreArea = function(text) {
	var encryptedStoreAreaStartMarker = "<pre id=\"encryptedStoreArea\" type=\"text/plain\" style=\"display:none;\">",
		encryptedStoreAreaStart = text.indexOf(encryptedStoreAreaStartMarker);
	if(encryptedStoreAreaStart !== -1) {
		var encryptedStoreAreaEnd = text.indexOf("</pre>",encryptedStoreAreaStart);
		if(encryptedStoreAreaEnd !== -1) {
			return $tw.utils.htmlDecode(text.substring(encryptedStoreAreaStart + encryptedStoreAreaStartMarker.length,encryptedStoreAreaEnd));
		}
	}
	return null;
};

exports.decryptStoreArea = function(encryptedStoreArea,password) {
	var decryptedText = $tw.crypto.decrypt(encryptedStoreArea,password);
	if(decryptedText) {
		var json = $tw.utils.parseJSONSafe(decryptedText),
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
