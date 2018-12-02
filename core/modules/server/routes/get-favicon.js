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
	response.writeHead(200, {"Content-Type": "image/x-icon"});
	var buffer = state.wiki.getTiddlerText("$:/favicon.ico","");
	response.end(buffer,"base64");
};

}());
