/*

The JavaScript code in this file is executed via `overlay.xul` when Firefox starts up.

*/

var TiddlyFox = {

	// Called when the main browser has loaded
	onLoad: function(event) {
		// Register a page load event
		var appcontent = document.getElementById("appcontent");
		if(appcontent){
			appcontent.addEventListener("DOMContentLoaded",TiddlyFox.onPageLoad,true);
		}
	},

	// Called each time a page loads
	onPageLoad: function(event) {
		// Get the document and window
		var doc = event.originalTarget,
			win = doc.defaultView;
		// If it is a TiddlyWiki
		if(TiddlyFox.isTiddlyWiki(doc,win)) {
			if(confirm("TiddlyFox: Enabling TiddlyWiki file saving capability")) {
				TiddlyFox.injectPage(doc);
			}
		}
	},

	injectPage: function(doc) {
		// Inject the message box
		var messageBox = doc.createElement("div");
		messageBox.id = "tiddlyfox-message-box";
		messageBox.style.display = "none";
		doc.body.appendChild(messageBox);
		// Attach the event handler to the message box
		messageBox.addEventListener("tiddlyfox-save-file",TiddlyFox.onSaveFile,false);
		// Load the script text
		var xhReq = new XMLHttpRequest();
		xhReq.open("GET","chrome://tiddlyfox/content/inject.js",false);
		xhReq.send(null);
		var injectCode = xhReq.responseText;
		// Inject the script
		var code = doc.createTextNode(injectCode);
		var scr = doc.createElement("script");
		scr.type = "text/javascript";
		scr.appendChild(code);
		doc.getElementsByTagName("head")[0].appendChild(scr)
	},

	saveFile: function(filePath,content) {
		try {
			netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
			var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
			file.initWithPath(filePath);
			if(!file.exists())
				file.create(0,0x01B4);// 0x01B4 = 0664
			var out = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
			out.init(file,0x22,0x04,null);
			out.write(content,content.length);
			out.flush();
			out.close();
			return true;
		} catch(ex) {
			return false;
		}
	},

	onSaveFile: function(event) {
		// Get the details from the message
		var message = event.target,
			path = message.getAttribute("tiddlyfox-path"),
			content = message.getAttribute("tiddlyfox-content");
		// Save the file
		TiddlyFox.saveFile(path,content);
		// Remove the message element from the message box
		message.parentNode.removeChild(message);
		return false;
	},

	// Called via `overlay.xul` when the menu item is selected
	onMenuItemCommand: function() {
		window.open("chrome://tiddlyfox/content/hello.xul", "", "chrome");
	},

	isTiddlyWiki: function(doc,win) {
		// Test whether the document is a TiddlyWiki (we don't have access to JS objects in it)
		return (doc.location.protocol === "file:") &&
			(doc.scripts[0].id === "versionArea");
	}

};

window.addEventListener("load",function load(event) {
	window.removeEventListener("load",load,false);
	TiddlyFox.onLoad(event);
},false); 
