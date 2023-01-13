/*\
title: $:/core/modules/server/routes/get-favicon.js
type: application/javascript
module-type: route

GET /favicon.ico

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "GET";

exports.path = /^\/favicon.ico$/;

exports.handler = function(request,response,state) {
	var buffer = state.wiki.getTiddlerText("$:/favicon.ico","");
	state.sendResponse(200,{"Content-Type": "image/x-icon"},buffer,"base64");
};

}());
