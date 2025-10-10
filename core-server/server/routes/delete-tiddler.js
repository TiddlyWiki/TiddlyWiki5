/*\
title: $:/core/modules/server/routes/delete-tiddler.js
type: application/javascript
module-type: route

DELETE /recipes/default/tiddlers/:title

\*/
"use strict";

exports.methods = ["DELETE"];

exports.path = /^\/bags\/default\/tiddlers\/(.+)$/;

exports.info = {
	priority: 100
};

exports.handler = function(request,response,state) {
	var title = $tw.utils.decodeURIComponentSafe(state.params[0]);
	state.wiki.deleteTiddler(title);
	response.writeHead(204, "OK", {
		"Content-Type": "text/plain"
	});
	response.end();
};
