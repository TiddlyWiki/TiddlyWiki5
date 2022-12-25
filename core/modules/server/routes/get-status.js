/*\
title: $:/core/modules/server/routes/get-status.js
type: application/javascript
module-type: route

GET /status

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "GET";

exports.path = /^\/status$/;

exports.handler = function(request,response,state) {
	$tw.perf.reset();
	$tw.perf.timer("stringify", "JSON.stringify");
	var text = JSON.stringify({
		username: state.authenticatedUsername || state.server.get("anon-username") || "",
		anonymous: !state.authenticatedUsername,
		read_only: !state.server.isAuthorized("writers",state.authenticatedUsername),
		logout_is_available: false,
		space: {
			recipe: "default"
		},
		tiddlywiki_version: $tw.version
	});
	$tw.perf.timer("stringify");
	state.sendResponse(200,{"Content-Type": "application/json", "Server-Timing": $tw.perf.generateHeader()},text,"utf8");
};

}());
