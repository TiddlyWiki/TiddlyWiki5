/*\
title: $:/plugins/tiddlywiki/sqlite3store/rawmarkup-bottombody.js
type: text/plain

Startup code injected as raw markup at the bottom of the body section

\*/

(function() {

// Create a Blob URL for our wasm data
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
	// Boot TiddlyWiki
	$tw.boot.boot();
});

})();
//# sourceURL=$:/plugins/tiddlywiki/sqlite3store/rawmarkup-bottombody.js