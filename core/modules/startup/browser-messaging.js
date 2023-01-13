/*\
title: $:/core/modules/browser-messaging.js
type: application/javascript
module-type: startup

Browser message handling

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "browser-messaging";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

/*
Load a specified url as an iframe and call the callback when it is loaded. If the url is already loaded then the existing iframe instance is used
*/
function loadIFrame(url,callback) {
	// Check if iframe already exists
	var iframeInfo = $tw.browserMessaging.iframeInfoMap[url];
	if(iframeInfo) {
		// We've already got the iframe
		callback(null,iframeInfo);
	} else {
		// Create the iframe and save it in the list
		var iframe = document.createElement("iframe");
		iframeInfo = {
			url: url,
			status: "loading",
			domNode: iframe
		};
		$tw.browserMessaging.iframeInfoMap[url] = iframeInfo;
		saveIFrameInfoTiddler(iframeInfo);
		// Add the iframe to the DOM and hide it
		iframe.style.display = "none";
		iframe.setAttribute("library","true");
		document.body.appendChild(iframe);
		// Set up onload
		iframe.onload = function() {
			iframeInfo.status = "loaded";
			saveIFrameInfoTiddler(iframeInfo);
			callback(null,iframeInfo);
		};
		iframe.onerror = function() {
			callback("Cannot load iframe");
		};
		try {
			iframe.src = url;
		} catch(ex) {
			callback(ex);
		}
	}
}

/*
Unload library iframe for given url
*/
function unloadIFrame(url){
	var iframes = document.getElementsByTagName('iframe');
	for(var t=iframes.length-1; t--; t>=0) {
		var iframe = iframes[t];
		if(iframe.getAttribute("library") === "true" &&
		  iframe.getAttribute("src") === url) {
			iframe.parentNode.removeChild(iframe);
		}
	}
}

function saveIFrameInfoTiddler(iframeInfo) {
	$tw.wiki.addTiddler(new $tw.Tiddler($tw.wiki.getCreationFields(),{
		title: "$:/temp/ServerConnection/" + iframeInfo.url,
		text: iframeInfo.status,
		tags: ["$:/tags/ServerConnection"],
		url: iframeInfo.url
	},$tw.wiki.getModificationFields()));
}

exports.startup = function() {
	// Initialise the store of iframes we've created
	$tw.browserMessaging = {
		iframeInfoMap: {} // Hashmap by URL of {url:,status:"loading/loaded",domNode:}
	};
	// Listen for widget messages to control loading the plugin library
	$tw.rootWidget.addEventListener("tm-load-plugin-library",function(event) {
		var paramObject = event.paramObject || {},
			url = paramObject.url;
		if(url) {
			loadIFrame(url,function(err,iframeInfo) {
				if(err) {
					alert($tw.language.getString("Error/LoadingPluginLibrary") + ": " + url);
				} else {
					iframeInfo.domNode.contentWindow.postMessage({
						verb: "GET",
						url: "recipes/library/tiddlers.json",
						cookies: {
							type: "save-info",
							infoTitlePrefix: paramObject.infoTitlePrefix || "$:/temp/RemoteAssetInfo/",
							url: url
						}
					},"*");
				}
			});
		}
	});
	// Listen for widget messages to control unloading the plugin library
	$tw.rootWidget.addEventListener("tm-unload-plugin-library",function(event) {
		var paramObject = event.paramObject || {},
			url = paramObject.url;
		$tw.browserMessaging.iframeInfoMap[url] = undefined;
		if(url) {
			unloadIFrame(url);
			$tw.utils.each(
				$tw.wiki.filterTiddlers("[[$:/temp/ServerConnection/" + url + "]] [prefix[$:/temp/RemoteAssetInfo/" + url + "/]]"),
				function(title) {
					$tw.wiki.deleteTiddler(title);
				}
			);
		}
	});
	$tw.rootWidget.addEventListener("tm-load-plugin-from-library",function(event) {
		var paramObject = event.paramObject || {},
			url = paramObject.url,
			title = paramObject.title;
		if(url && title) {
			loadIFrame(url,function(err,iframeInfo) {
				if(err) {
					alert($tw.language.getString("Error/LoadingPluginLibrary") + ": " + url);
				} else {
					iframeInfo.domNode.contentWindow.postMessage({
						verb: "GET",
						url: "recipes/library/tiddlers/" + encodeURIComponent(title) + ".json",
						cookies: {
							type: "save-tiddler",
							url: url
						}
					},"*");
				}
			});
		}
	});
	// Listen for window messages from other windows
	window.addEventListener("message",function listener(event){
		// console.log("browser-messaging: ",document.location.toString())
		// console.log("browser-messaging: Received message from",event.origin);
		// console.log("browser-messaging: Message content",event.data);
		switch(event.data.verb) {
			case "GET-RESPONSE":
				if(event.data.status.charAt(0) === "2") {
					if(event.data.cookies) {
						if(event.data.cookies.type === "save-info") {
							var tiddlers = $tw.utils.parseJSONSafe(event.data.body);
							$tw.utils.each(tiddlers,function(tiddler) {
								$tw.wiki.addTiddler(new $tw.Tiddler($tw.wiki.getCreationFields(),tiddler,{
									title: event.data.cookies.infoTitlePrefix + event.data.cookies.url + "/" + tiddler.title,
									"original-title": tiddler.title,
									text: "",
									type: "text/vnd.tiddlywiki",
									"original-type": tiddler.type,
									"plugin-type": undefined,
									"original-plugin-type": tiddler["plugin-type"],
									"module-type": undefined,
									"original-module-type": tiddler["module-type"],
									tags: ["$:/tags/RemoteAssetInfo"],
									"original-tags": $tw.utils.stringifyList(tiddler.tags || []),
									"server-url": event.data.cookies.url
								},$tw.wiki.getModificationFields()));
							});
						} else if(event.data.cookies.type === "save-tiddler") {
							var tiddler = $tw.utils.parseJSONSafe(event.data.body);
							$tw.wiki.addTiddler(new $tw.Tiddler(tiddler));
						}
					}
				}
				break;
		}
	},false);
};

})();
