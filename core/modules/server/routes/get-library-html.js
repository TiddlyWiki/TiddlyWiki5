/*\
title: $:/core/modules/server/routes/get-library-html.js
type: application/javascript
module-type: route

GET /library/{:title}

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "GET";

exports.path = /^\/library$/;

exports.handler = function(request,response,state) {
	var text = state.wiki.getTiddlerText("$:/core/templates/library.template.html","");
	state.sendResponse(200,{"Content-Type": "text/html"},text,"utf8");
};

}());
