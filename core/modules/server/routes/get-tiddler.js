/*\
title: $:/core/modules/server/routes/get-tiddler.js
type: application/javascript
module-type: route

GET /recipes/default/tiddlers/:title

\*/
"use strict";

exports.method = "GET";

exports.path = /^\/recipes\/default\/tiddlers\/(.+)$/;

exports.handler = function(request,response,state) {
	const title = $tw.utils.decodeURIComponentSafe(state.params[0]);
	const tiddler = state.wiki.getTiddler(title);
	const tiddlerFields = {};
	const knownFields = new Set([
		"bag","created","creator","modified","modifier","permissions","recipe","revision","tags","text","title","type","uri"
	]);
	if(tiddler) {
		$tw.utils.each(tiddler.fields,(field,name) => {
			const value = tiddler.getFieldString(name);
			if(knownFields.has(name)) {
				tiddlerFields[name] = value;
			} else {
				tiddlerFields.fields = tiddlerFields.fields || {};
				tiddlerFields.fields[name] = value;
			}
		});
		tiddlerFields.revision = state.wiki.getChangeCount(title);
		tiddlerFields.bag = "default";
		tiddlerFields.type = tiddlerFields.type || "text/vnd.tiddlywiki";
		state.sendResponse(200,{"Content-Type": "application/json"},JSON.stringify(tiddlerFields),"utf8");
	} else {
		response.writeHead(404);
		response.end();
	}
};
