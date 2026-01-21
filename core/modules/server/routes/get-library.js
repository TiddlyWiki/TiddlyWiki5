/*\
title: $:/core/modules/server/routes/get-library.js
type: application/javascript
module-type: route

GET /library

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "GET";

exports.path = /^\/library\/$/;

exports.handler = function(request,response,state) {
	var text = JSON.stringify($tw.library.getMetadata());
	state.sendResponse(200,{"Content-Type": "application/json"},text,"utf8");
};

}());
