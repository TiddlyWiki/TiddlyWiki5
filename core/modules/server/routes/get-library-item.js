/*\
title: $:/core/modules/server/routes/get-library-item.js
type: application/javascript
module-type: route

GET /library

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "GET";

exports.path = /^\/library\/(.+)$/;

exports.handler = function(request,response,state) {
	var title = $tw.utils.decodeURIComponentSafe($tw.utils.decodeURIComponentSafe(state.params[0])),
		item = $tw.library.getItem(title);
	if(item) {
		var text = JSON.stringify(item);
		state.sendResponse(200,{"Content-Type": "application/json"},text,"utf8");	
	} else {
		response.writeHead(404);
		response.end();
	}
};

}());
