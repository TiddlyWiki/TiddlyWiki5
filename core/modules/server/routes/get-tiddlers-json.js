/*\
title: $:/core/modules/server/routes/get-tiddlers-json.js
type: application/javascript
module-type: route

GET /recipes/default/tiddlers.json?filter=<filter>

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var DEFAULT_FILTER = "[all[tiddlers]!is[system]sort[title]]";

exports.method = "GET";

exports.path = /^\/recipes\/default\/tiddlers.json$/;

exports.handler = function(request,response,state) {
	var filter = state.queryParameters.filter || DEFAULT_FILTER;
	if(state.wiki.getTiddlerText("$:/config/Server/AllowAllExternalFilters") !== "yes") {
		if(state.wiki.getTiddlerText("$:/config/Server/ExternalFilters/" + filter) !== "yes") {
			console.log("Blocked attempt to GET /recipes/default/tiddlers.json with filter: " + filter);
			response.writeHead(403);
			response.end();
			return;
		}
	}
	if(state.wiki.getTiddlerText("$:/config/SyncSystemTiddlersFromServer") === "no") {
		filter += "+[!is[system]]";
	}
	var excludeFields = (state.queryParameters.exclude || "text").split(","),
		titles = state.wiki.filterTiddlers(filter);
	var tiddlers = [];
	$tw.utils.each(titles,function(title) {
		var tiddler = state.wiki.getTiddler(title);
		if(tiddler) {
			var tiddlerFields = tiddler.getFieldStrings({exclude: excludeFields});
			tiddlerFields.revision = state.wiki.getChangeCount(title);
			tiddlerFields.type = tiddlerFields.type || "text/vnd.tiddlywiki";
			tiddlers.push(tiddlerFields);
		}
	});
	var text = JSON.stringify(tiddlers);
	state.sendResponse(200,{"Content-Type": "application/json"},text,"utf8");
};

}());
