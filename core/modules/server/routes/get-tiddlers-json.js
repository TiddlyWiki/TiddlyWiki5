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
	$tw.perf.reset();
	var filter = state.queryParameters.filter || DEFAULT_FILTER;
	$tw.perf.timer("check-config", "Config about filters and system tiddlers");
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
	$tw.perf.timer("check-config");
	// filtering will call perf there
	var excludeFields = (state.queryParameters.exclude || "text").split(","),
		titles = state.wiki.filterTiddlers(filter);
	var tiddlers = [];
	$tw.perf.timer("get-tiddlers", "Get each tiddler as list");
	$tw.utils.each(titles,function(title) {
		var tiddler = state.wiki.getTiddler(title);
		if(tiddler) {
			var tiddlerFields = tiddler.getFieldStrings({exclude: excludeFields});
			tiddlerFields.revision = state.wiki.getChangeCount(title);
			tiddlerFields.type = tiddlerFields.type || "text/vnd.tiddlywiki";
			tiddlers.push(tiddlerFields);
		}
	});
	$tw.perf.timer("get-tiddlers");
	$tw.perf.timer("stringify-tiddlers", "JSON.stringify");
	var text = JSON.stringify(tiddlers);
	$tw.perf.timer("stringify-tiddlers");
	state.sendResponse(200,{"Content-Type": "application/json", "Server-Timing": $tw.perf.generateHeader()},text,"utf8");
};

}());
