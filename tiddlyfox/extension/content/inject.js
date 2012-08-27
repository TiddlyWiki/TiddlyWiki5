/*
The JavaScript in this file is injected into each TiddlyWiki page that loads
*/

(function () {

	/*
	Returns true if successful, false if failed, null if not available
	*/
	var injectedSaveFile = function(path,content) {
		// Find the message box element
		var messageBox = document.getElementById("tiddlyfox-message-box");
		if(messageBox) {
			// Create the message element and put it in the message box
			var message = document.createElement("div");
			message.setAttribute("tiddlyfox-path",path);
			message.setAttribute("tiddlyfox-content",content);
			messageBox.appendChild(message);
			// Create and dispatch the custom event to the extension
			var event = document.createEvent("Events");
			event.initEvent("tiddlyfox-save-file",true,false);
			message.dispatchEvent(event);
		}
		return true;
	};

	/*
	Returns text if successful, false if failed, null if not available
	*/
	var injectedLoadFile = function(path) {
		try {
			// Just the read the file synchronously
			var xhReq = new XMLHttpRequest();
			xhReq.open("GET", "file://" + path, false);
			xhReq.send(null);
			return xhReq.responseText;
		} catch(ex) {
			return false;
		}
	};

	window.mozillaSaveFile = injectedSaveFile;
	window.mozillaLoadFile = injectedLoadFile;

})();