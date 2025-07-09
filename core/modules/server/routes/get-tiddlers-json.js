/*\
title: $:/core/modules/server/routes/get-tiddlers-json.js
type: application/javascript
module-type: route

GET /recipes/default/tiddlers.json?filter=<filter>

\*/
"use strict";

const DEFAULT_FILTER = "[all[tiddlers]!is[system]sort[title]]";

exports.method = "GET";

exports.path = /^\/recipes\/default\/tiddlers.json$/;

exports.handler = function(request,response,state) {
	let filter = state.queryParameters.filter || DEFAULT_FILTER;
	if(state.wiki.getTiddlerText("$:/config/Server/AllowAllExternalFilters") !== "yes") {
		if(state.wiki.getTiddlerText(`$:/config/Server/ExternalFilters/${filter}`) !== "yes") {
			console.log(`Blocked attempt to GET /recipes/default/tiddlers.json with filter: ${filter}`);
			response.writeHead(403);
			response.end();
			return;
		}
	}
	if(state.wiki.getTiddlerText("$:/config/SyncSystemTiddlersFromServer") === "no") {
		filter += "+[!is[system]]";
	}
	const excludeFields = (state.queryParameters.exclude || "text").split(",");
	const titles = state.wiki.filterTiddlers(filter);
	const tiddlers = [];
	$tw.utils.each(titles,(title) => {
		const tiddler = state.wiki.getTiddler(title);
		if(tiddler) {
			const tiddlerFields = tiddler.getFieldStrings({exclude: excludeFields});
			tiddlerFields.revision = state.wiki.getChangeCount(title);
			tiddlerFields.type = tiddlerFields.type || "text/vnd.tiddlywiki";
			tiddlers.push(tiddlerFields);
		}
	});
	const text = JSON.stringify(tiddlers);
	state.sendResponse(200,{"Content-Type": "application/json"},text,"utf8");
};
