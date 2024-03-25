/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/get-recipe-events.js
type: application/javascript
module-type: mws-route

GET /recipes/:recipe_name/events

headers:

Last-Event-ID: 

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

const SSE_HEARTBEAT_INTERVAL_MS = 10 * 1000;

exports.method = "GET";

exports.path = /^\/recipes\/([^\/]+)\/events$/;

exports.handler = function(request,response,state) {
	// Get the  parameters
	const recipe_name = $tw.utils.decodeURIComponentSafe(state.params[0]);
	let last_known_tiddler_id = 0;
	if(request.headers["Last-Event-ID"]) {
		last_known_tiddler_id = $tw.utils.parseNumber(request.headers["Last-Event-ID"]);
	} else if(state.queryParameters.last_known_tiddler_id) {
		last_known_tiddler_id = $tw.utils.parseNumber(state.queryParameters.last_known_tiddler_id);
	}
	if(recipe_name) {
		// Start streaming the response
		response.writeHead(200, {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			"Connection": "keep-alive"
		});
		// Setup the heartbeat timer
		var heartbeatTimer = setInterval(function() {
			response.write(':keep-alive\n\n');
		},SSE_HEARTBEAT_INTERVAL_MS);
		// Method to get changed tiddler events and send to the client
		function sendUpdates() {
			// Get the tiddlers in the recipe since the last known tiddler_id
			var recipeTiddlers = $tw.mws.store.getRecipeTiddlers(recipe_name,{
				include_deleted: true,
				last_known_tiddler_id: last_known_tiddler_id
			});
			// Send to the client
			if(recipeTiddlers) {
				for(let index = recipeTiddlers.length-1; index>=0; index--) {
					const tiddlerInfo = recipeTiddlers[index];
					if(tiddlerInfo.tiddler_id > last_known_tiddler_id) {
						last_known_tiddler_id = tiddlerInfo.tiddler_id;
					}
					response.write(`event: change\n`)
					let data = tiddlerInfo;
					if(!tiddlerInfo.is_deleted) {
						const tiddler = $tw.mws.store.getRecipeTiddler(tiddlerInfo.title,recipe_name);
						if(tiddler) {
							data = $tw.utils.extend({},data,{tiddler: tiddler.tiddler})
						}	
					}
					response.write(`data: ${JSON.stringify(data)}\n`);
					response.write(`id: ${tiddlerInfo.tiddler_id}\n`)
					response.write(`\n`);
				}
			}
		}
		// Send current and future changes
		sendUpdates();
		$tw.mws.store.addEventListener("change",sendUpdates);
		// Clean up when the connection closes
		response.on("close",function () {
			clearInterval(heartbeatTimer);
			$tw.mws.store.removeEventListener("change",sendUpdates);
		});
		return;
	}
	// Fail if something went wrong
	response.writeHead(404);
	response.end();
};

}());
