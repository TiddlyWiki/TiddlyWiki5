/*\
title: $:/plugins/tiddlywiki/sqlite3store/init-sqlite3.js
type: application/javascript

Initialise sqlite3 and then boot TiddlyWiki

This file is spliced into the HTML file to be executed after the boot kernel has been loaded.

\*/

(function() {

// Get the main tiddler store out of the HTML file
var storeEl = document.querySelector("script.tiddlywiki-tiddler-store"),
	tiddlerStore = JSON.parse(storeEl.textContent);

// Helper to get a tiddler from the store by title
function getTiddler(title) {
	for(var t=0; t<tiddlerStore.length; t++) {
		var tiddler = tiddlerStore[t];
		if(tiddler.title === title) {
			return tiddler;
		}
	}
	return undefined;
}
// Get the shadow tiddlers of this plugin
var thisPlugin = getTiddler("$:/plugins/tiddlywiki/sqlite3store"),
	thisPluginTiddlers = JSON.parse(thisPlugin.text).tiddlers;
// Execute the sqlite3 module
var sqlite3js = thisPluginTiddlers["$:/plugins/tiddlywiki/sqlite3store/sqlite3.js"].text,
	context = {
		exports: {}
	};
$tw.utils.evalSandboxed(sqlite3js,context,"$:/plugins/tiddlywiki/sqlite3store/sqlite3.js",true);
// Create a Blob URL for the wasm data
var sqlite3wasm = thisPluginTiddlers["$:/plugins/tiddlywiki/sqlite3store/sqlite3.wasm"].text;
var decodedData = window.atob(sqlite3wasm),
	uInt8Array = new Uint8Array(decodedData.length);
for (var i = 0; i < decodedData.length; ++i) {
	uInt8Array[i] = decodedData.charCodeAt(i);
}
var blobUrl = URL.createObjectURL(new Blob([uInt8Array],{type: "application/wasm"}));
// Pass sqlite an URLSearchParams object containing the Blob URL of our wasm data
self.sqlite3InitModuleState.urlParams = new URLSearchParams();
self.sqlite3InitModuleState.urlParams.set("sqlite3.wasm",blobUrl);
// Initialise sqlite
self.sqlite3InitModule().then((sqlite3)=>{
	// Save a reference to the sqlite3 object
	$tw.sqlite3 = sqlite3;
	var capi = $tw.sqlite3.capi, // C-style API
		  oo = $tw.sqlite3.oo1; // High-level OO API
	// Get version numbers
	console.log("sqlite3 version",capi.sqlite3_libversion());
	// Boot TiddlyWiki
	$tw.boot.boot();
});

})();
//# sourceURL=$:/plugins/tiddlywiki/sqlite3store/init-sqlite3.js