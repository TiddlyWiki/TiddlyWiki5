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
		// If it is a TiddlyWiki classic
		if(TiddlyFox.isTiddlyWikiClassic(doc,win)) {
			if(confirm("TiddlyFox: Enabling TiddlyWiki file saving capability")) {
				TiddlyFox.injectScript(doc);
				TiddlyFox.injectMessageBox(doc);
			}
		// If it is a TiddlyWiki5
		} else if(TiddlyFox.isTiddlyWiki5(doc,win)) {
			if(confirm("TiddlyFox: Enabling TiddlyWiki5 file saving capability")) {
				TiddlyFox.injectMessageBox(doc);
			}
		}
	},

	injectScript: function(doc) {
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

	injectMessageBox: function(doc) {
		// Inject the message box
		var messageBox = doc.getElementById("tiddlyfox-message-box");
		if(!messageBox) {
			messageBox = doc.createElement("div");
			messageBox.id = "tiddlyfox-message-box";
			messageBox.style.display = "none";
			doc.body.appendChild(messageBox);
		}
		// Attach the event handler to the message box
		messageBox.addEventListener("tiddlyfox-save-file",TiddlyFox.onSaveFile,false);
	},

	saveFile: function(filePath,content) {
		// Attempt to convert the filepath to a proper UTF-8 string
		try {
			var converter = Components.classes["@mozilla.org/intl/utf8converterservice;1"].getService(Components.interfaces.nsIUTF8ConverterService);
			filePath = converter.convertURISpecToUTF8(filePath,"UTF-8");
		} catch(ex) {
		}
		// Save the file
		try {
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
			path = message.getAttribute("data-tiddlyfox-path"),
			content = message.getAttribute("data-tiddlyfox-content");
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

	isTiddlyWikiClassic: function(doc,win) {
		// Test whether the document is a TiddlyWiki (we don't have access to JS objects in it)
		return (doc.location.protocol === "file:") &&
			(doc.scripts[0].id === "versionArea");
	},

	isTiddlyWiki5: function(doc,win) {
		// Test whether the document is a TiddlyWiki5 (we don't have access to JS objects in it)
		var metaTags = doc.getElementsByTagName("meta"),
			generator = false;
		for(var t=0; t<metaTags.length; t++) {
			if(metaTags[t].name === "application-name" && metaTags[t].content === "TiddlyWiki") {
				generator = true;
			}
		}
		return (doc.location.protocol === "file:") && generator;
	}

};

window.addEventListener("load",function load(event) {
	window.removeEventListener("load",load,false);
	TiddlyFox.onLoad(event);
},false); 
