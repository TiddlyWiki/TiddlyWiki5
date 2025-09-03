/*\
title: $:/plugins/tiddlywiki/pluginlibrary/libraryserver.js
type: application/javascript
module-type: library

A simple HTTP-over-window.postMessage implementation of a standard TiddlyWeb-compatible server. It uses real HTTP to load the individual tiddler JSON files.

\*/

"use strict";

// Listen for window messages
window.addEventListener("message",function listener(event){
	console.log("plugin library: Received message from",event.origin);
	console.log("plugin library: Message content",event.data);
	switch(event.data.verb) {
		case "GET":
			if(event.data.url === "recipes/library/tiddlers.json") {
				// Route for recipes/library/tiddlers.json
				event.source.postMessage({
					verb: "GET-RESPONSE",
					status: "200",
					cookies: event.data.cookies,
					url: event.data.url,
					type: "application/json",
					body: JSON.stringify(assetList,null,4)
				},"*");
			} else if(event.data.url.indexOf("recipes/library/tiddlers/") === 0) {
				var url = "recipes/library/tiddlers/" + encodeURIComponent(removePrefix(event.data.url,"recipes/library/tiddlers/"));
				// Route for recipes/library/tiddlers/<uri-encoded-tiddler-title>.json
				httpGet(url,function(err,responseText) {
					if(err) {
						event.source.postMessage({
							verb: "GET-RESPONSE",
							status: "404",
							cookies: event.data.cookies,
							url: event.data.url,
							type: "text/plain",
							body: "Not found"
						},"*");
					} else {
						event.source.postMessage({
							verb: "GET-RESPONSE",
							status: "200",
							cookies: event.data.cookies,
							url: event.data.url,
							type: "application/json",
							body: responseText
						},"*");
					}
				});
			} else {
				event.source.postMessage({
					verb: "GET-RESPONSE",
					status: "404",
					cookies: event.data.cookies,
					url: event.data.url,
					type: "text/plain",
					body: "Not found"
				},"*");
			}
			break;
	}
},false);

// Helper to remove string prefixes
function removePrefix(string,prefix) {
	if(string.indexOf(prefix) === 0) {
		return string.substr(prefix.length);
	} else {
		return string;
	}
}

// Helper for HTTP GET
function httpGet(url,callback) {
	var http = new XMLHttpRequest();
	http.open("GET",url,true);
	http.onreadystatechange = function() {
		if(http.readyState == 4 && http.status == 200) {
			callback(null,http.responseText);
		}
	};
	http.send();
}
