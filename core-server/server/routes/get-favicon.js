/*\
title: $:/core/modules/server/routes/get-favicon.js
type: application/javascript
module-type: route

GET /favicon.ico

\*/
"use strict";

exports.methods = ["GET"];

exports.path = /^\/favicon.ico$/;

exports.info = {
	priority: 100
};

exports.handler = function(request,response,state) {
	var buffer = state.wiki.getTiddlerText("$:/favicon.ico","");
	state.sendResponse(200,{"Content-Type": "image/x-icon"},buffer,"base64");
};
