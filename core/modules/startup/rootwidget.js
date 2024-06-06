/*\
title: $:/core/modules/startup/rootwidget.js
type: application/javascript
module-type: startup

Setup the root widget and the core root widget handlers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "rootwidget";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.before = ["story"];
exports.synchronous = true;

exports.startup = function() {
	// Install the HTTP client event handler
	$tw.httpClient = new $tw.utils.HttpClient();
	var getPropertiesWithPrefix = function(properties,prefix) {
		var result = Object.create(null);
		$tw.utils.each(properties,function(value,name) {
			if(name.indexOf(prefix) === 0) {
				result[name.substring(prefix.length)] = properties[name];
			}
		});
		return result;
	};
	$tw.rootWidget.addEventListener("tm-http-request",function(event) {
		var params = event.paramObject || {};
		$tw.httpClient.initiateHttpRequest({
			wiki: event.widget.wiki,
			url: params.url,
			method: params.method,
			body: params.body,
			binary: params.binary,
			useDefaultHeaders: params.useDefaultHeaders,
			oncompletion: params.oncompletion,
			onprogress: params.onprogress,
			bindStatus: params["bind-status"],
			bindProgress: params["bind-progress"],
			variables: getPropertiesWithPrefix(params,"var-"),
			headers: getPropertiesWithPrefix(params,"header-"),
			passwordHeaders: getPropertiesWithPrefix(params,"password-header-"),
			queryStrings: getPropertiesWithPrefix(params,"query-"),
			passwordQueryStrings: getPropertiesWithPrefix(params,"password-query-"),
			basicAuthUsername: params["basic-auth-username"],
			basicAuthUsernameFromStore: params["basic-auth-username-from-store"],
			basicAuthPassword: params["basic-auth-password"],
			basicAuthPasswordFromStore: params["basic-auth-password-from-store"]
		});
	});
	$tw.rootWidget.addEventListener("tm-http-cancel-all-requests",function(event) {
		$tw.httpClient.cancelAllHttpRequests();
	});
	// Install the modal message mechanism
	$tw.modal = new $tw.utils.Modal($tw.wiki);
	$tw.rootWidget.addEventListener("tm-modal",function(event) {
		$tw.modal.display(event.param,{variables: event.paramObject, event: event});
	});
	$tw.rootWidget.addEventListener("tm-show-switcher",function(event) {
		$tw.modal.display("$:/core/ui/SwitcherModal",{variables: event.paramObject, event: event});
	});
	// Install the notification  mechanism
	$tw.notifier = new $tw.utils.Notifier($tw.wiki);
	$tw.rootWidget.addEventListener("tm-notify",function(event) {
		$tw.notifier.display(event.param,{variables: event.paramObject});
	});
	// Install the copy-to-clipboard  mechanism
	$tw.rootWidget.addEventListener("tm-copy-to-clipboard",function(event) {
		$tw.utils.copyToClipboard(event.param,{
			successNotification: event.paramObject && event.paramObject.successNotification,
			failureNotification: event.paramObject && event.paramObject.failureNotification
		});
	});
	// Install the tm-focus-selector message
	$tw.rootWidget.addEventListener("tm-focus-selector",function(event) {
		var selector = event.param || "",
			element,
		    	baseElement = event.event && event.event.target ? event.event.target.ownerDocument : document;
		element = $tw.utils.querySelectorSafe(selector,baseElement);
		if(element && element.focus) {
			element.focus(event.paramObject);
		}
	});
	// Install the tm-rename-tiddler and tm-relink-tiddler messages
	var makeRenameHandler = function(method) {
		return function(event) {
			var options = {},
				paramObject = event.paramObject || {},
				from = paramObject.from || event.tiddlerTitle,
				to = paramObject.to;
			options.dontRenameInTags = (paramObject.renameInTags === "false" || paramObject.renameInTags === "no") ? true : false;
			options.dontRenameInLists = (paramObject.renameInLists === "false" || paramObject.renameInLists === "no") ? true : false;
			$tw.wiki[method](from,to,options);
		};
	};
	$tw.rootWidget.addEventListener("tm-rename-tiddler",makeRenameHandler("renameTiddler"));
	$tw.rootWidget.addEventListener("tm-relink-tiddler",makeRenameHandler("relinkTiddler"));
	// Install the scroller
	$tw.pageScroller = new $tw.utils.PageScroller();
	$tw.rootWidget.addEventListener("tm-scroll",function(event) {
		$tw.pageScroller.handleEvent(event);
	});
	var fullscreen = $tw.utils.getFullScreenApis();
	if(fullscreen) {
		$tw.rootWidget.addEventListener("tm-full-screen",function(event) {
			var fullScreenDocument = event.event ? event.event.target.ownerDocument : document;
			if(event.param === "enter") {
				fullScreenDocument.documentElement[fullscreen._requestFullscreen](Element.ALLOW_KEYBOARD_INPUT);
			} else if(event.param === "exit") {
				fullScreenDocument[fullscreen._exitFullscreen]();
			} else {
				if(fullScreenDocument[fullscreen._fullscreenElement]) {
					fullScreenDocument[fullscreen._exitFullscreen]();
				} else {
					fullScreenDocument.documentElement[fullscreen._requestFullscreen](Element.ALLOW_KEYBOARD_INPUT);
				}
			}
		});
	}
};

})();
