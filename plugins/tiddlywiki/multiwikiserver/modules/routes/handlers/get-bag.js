/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/get-bag.js
type: application/javascript
module-type: mws-route

GET /bags/:bag_name/
GET /bags/:bag_name

\*/
(function () {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "GET";

exports.path = /^\/bags\/([^\/]+)(\/?)$/;

exports.useACL = true;

exports.entityName = "bag"

exports.handler = function (request, response, state) {
	// Redirect if there is no trailing slash
	if (state.params[1] !== "/") {
		state.redirect(301, state.urlInfo.path + "/");
		return;
	}

	// Get the parameters and bag list
	var bag_name = $tw.utils.decodeURIComponentSafe(state.params[0]),
		filterText = state.queryParameters ? state.queryParameters.filter || "" : "",
		filterField = state.queryParameters ? state.queryParameters.field || "title" : "title",
		bagTiddlers = bag_name && (filterText ?
			$tw.mws.store.sqlTiddlerDatabase.getFilteredBagTiddlers(bag_name, filterText, filterField) :
			$tw.mws.store.getBagTiddlers(bag_name)),
		bagList = $tw.mws.store.listBags();
		

	if (bag_name && bagTiddlers) {
		// Handle JSON API request
		if (request.headers.accept && request.headers.accept.indexOf("application/json") !== -1) {
			state.sendResponse(200, { "Content-Type": "application/json" }, JSON.stringify(bagTiddlers), "utf8");
		} else {
			if (!response.headersSent) {
				// Filter bags by user's read access from ACL
				var allowedBags = bagList.filter(bag =>
					bag.bag_name.startsWith("$:/") ||
					state.server.sqlTiddlerDatabase.hasBagPermission(state.authenticatedUser?.user_id, bag.bag_name, 'READ') ||
					state.allowAnon && state.allowAnonReads
				);

				// Filter out system tiddlers unless explicitly shown
				if (!state.queryParameters.show_system || state.queryParameters.show_system === "off") {
					allowedBags = allowedBags.filter(bag => !bag.bag_name.startsWith("$:/"));
				}

				response.writeHead(200, "OK", {
					"Content-Type": "text/html"
				});
				var html = $tw.mws.store.adminWiki.renderTiddler("text/plain", "$:/plugins/tiddlywiki/multiwikiserver/templates/page", {
					variables: {
						"page-content": "$:/plugins/tiddlywiki/multiwikiserver/templates/get-bag",
						"bag-name": bag_name,
						"bag-titles": JSON.stringify(bagTiddlers.map(bagTiddler => bagTiddler.title)),
						"bag-tiddlers": JSON.stringify(bagTiddlers),
						"bag-list": JSON.stringify(allowedBags),
						"current-filter": filterText,
						"current-field": filterField
					}
				});
				response.write(html);
				response.end();
			}
		}
	} else {
		if (!response.headersSent) {
			response.writeHead(404);
			response.end();
		}
	}
};

}());