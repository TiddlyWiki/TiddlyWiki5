/*\
title: $:/core/modules/server/server-sent-events.js
type: application/javascript
module-type: library
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
parameters:
		prefix - usually the plugin path, such as `plugins/tiddlywiki/tiddlyweb`. The
			route will match `/events/${prefix}` exactly.

		handler - a function that will be called each time a request comes in with the
			request and state from the route and an emit function to call.
*/

var ServerSentEvents = function ServerSentEvents(prefix, handler) {
	this.handler = handler;
	this.prefix = prefix;
};

ServerSentEvents.prototype.getExports = function() {
	return {
		bodyFormat: "stream",
		method: "GET",
		path: new RegExp("^/events/" + this.prefix + "$"),
		handler: this.handleEventRequest.bind(this)
	};
};

ServerSentEvents.prototype.handleEventRequest = function(request,response,state) {
	if(ServerSentEvents.prototype.isEventStreamRequest(request)) {
		response.writeHead(200, {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			"Connection": "keep-alive"
		});
		this.handler(request,state,this.emit.bind(this,response),this.end.bind(this,response));
	} else {
		response.writeHead(406,"Not Acceptable",{});
		response.end();
	}
};

ServerSentEvents.prototype.isEventStreamRequest = function(request) {
	return request.headers.accept &&
		request.headers.accept.match(/^text\/event-stream/);
};

ServerSentEvents.prototype.emit = function(response,event,data) {
	if(typeof event !== "string" || event.indexOf("\n") !== -1) {
		throw new Error("Type must be a single-line string");
	}
	if(typeof data !== "string" || data.indexOf("\n") !== -1) {
		throw new Error("Data must be a single-line string");
	}
	response.write("event: " + event + "\ndata: " + data + "\n\n", "utf8");
};

ServerSentEvents.prototype.end = function(response) {
	response.end();
};

exports.ServerSentEvents = ServerSentEvents;

})();
