/*\
title: $:/core/modules/server/routes/get-tiddlers-json.js
type: application/javascript
module-type: route

GET /recipes/default/tiddlers/tiddlers.json?filter=<filter>

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var DEFAULT_FILTER = "[all[tiddlers]!is[system]sort[title]]",
	DEFAULT_TIDDLYWEB_FILTER = "[all[tiddlers]] -[[$:/isEncrypted]] -[prefix[$:/temp/]] -[prefix[$:/status/]]",
	DEFAULT_ALLOWED_FILTERS = [
		DEFAULT_FILTER,
		DEFAULT_TIDDLYWEB_FILTER
	];

exports.method = "GET";

exports.path = /^\/recipes\/default\/tiddlers.json$/;

exports.handler = function(request,response,state) {
	var configAllowedFilters = $tw.boot.wikiInfo.config["server-get-tiddlers-allowed-filters"],
		allowedFilters;
	if(configAllowedFilters === "all") {
		allowedFilters = null;
	} else if ($tw.utils.isArray(configAllowedFilters)) {
		allowedFilters = configAllowedFilters;
	} else {
		allowedFilters = DEFAULT_ALLOWED_FILTERS;
	}
	var filter = state.queryParameters.filter || DEFAULT_FILTER;
	if(allowedFilters && allowedFilters.indexOf(filter) === -1) {
		console.log("Blocked attempt to GET /recipes/default/tiddlers/tiddlers.json with filter: " + filter);
		response.writeHead(403);
		response.end();
		return;
	}
	var excludeFields = (state.queryParameters.exclude || "text").split(","),
		titles = state.wiki.filterTiddlers(filter);
	response.writeHead(200, {"Content-Type": "application/json"});
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
	response.end(text,"utf8");
};

}());
