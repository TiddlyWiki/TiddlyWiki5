/*\
title: $:/core/modules/server/routes/get-index.js
type: application/javascript
module-type: route

GET /

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "GET";

exports.path = /^\/$/;

exports.handler = function(request,response,state) {
	response.writeHead(200, {"Content-Type": state.server.get("servetype")});
	var text = state.wiki.renderTiddler(state.server.get("rendertype"),state.server.get("roottiddler"));
	response.end(text,"utf8");
};

}());
