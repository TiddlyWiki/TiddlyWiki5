/*\
title: $:/plugins/tiddlywiki/tiddlyweb/sse-server.js
type: application/javascript
module-type: route

GET /events/plugins/tiddlywiki/tiddlyweb

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var wikis = [];
var connections = [];

/*
Setup up the array for this wiki and add the change listener
*/
function setupWiki(wiki) {
	var index = wikis.length;
	// Add a new array for this wiki (object references work as keys)
	wikis.push(wiki);
	connections.push([]);
	// Listen to change events for this wiki
	wiki.addEventListener("change",function(changes) {
		var jsonChanges = JSON.stringify(changes);
		getWikiConnections(wiki).forEach(function(item) {
			item.emit("change",jsonChanges);
		});
	});
	return index;
}

/*
Setup this particular wiki if we haven't seen it before
*/
function ensureWikiSetup(wiki) {
	if(wikis.indexOf(wiki) === -1) {
		setupWiki(wiki);
	}
}

/*
Return the array of connections for a particular wiki
*/
function getWikiConnections(wiki) {
	return connections[wikis.indexOf(wiki)];
}

function addWikiConnection(wiki,connection) {
	getWikiConnections(wiki).push(connection);
}

function removeWikiConnection(wiki,connection) {
	var wikiConnections = getWikiConnections(wiki);
	var index = wikiConnections.indexOf(connection);
	if(index !== -1) {
		wikiConnections.splice(index,1);
	}
}

function handleConnection(request,state,emit,end) {
	if(isDisabled(state)) {
		return;
	}

	ensureWikiSetup(state.wiki);
	// Add the connection to the list of connections for this wiki
	var connection = {
		request: request,
		state: state,
		emit: emit,
		end: end
	};
	addWikiConnection(state.wiki,connection);
	request.on("close",function() {
		removeWikiConnection(state.wiki,connection);
	});
}

function isDisabled(state) {
	return state.server.get("sse-enabled") !== "yes";
}

// Import the ServerSentEvents class
var ServerSentEvents = require("$:/core/modules/server/server-sent-events.js").ServerSentEvents;
// Instantiate the class
var events = new ServerSentEvents("plugins/tiddlywiki/tiddlyweb", handleConnection);
// Export the route definition for this server sent events instance
module.exports = events.getExports();

})();
