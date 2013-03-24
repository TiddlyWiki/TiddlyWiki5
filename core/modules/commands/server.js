/*\
title: $:/core/modules/commands/server.js
type: application/javascript
module-type: command

Serve tiddlers over http

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

if(!$tw.browser) {
	var util = require("util"),
		fs = require("fs"),
		url = require("url"),
		path = require("path"),
		http = require("http");	
}

exports.info = {
	name: "server",
	synchronous: true
};

/*
A simple HTTP server with regexp-based routes
*/
function SimpleServer(options) {
	this.routes = options.routes || [];
	this.wiki = options.wiki;
	this.variables = options.variables || {};
}

SimpleServer.prototype.set = function(obj) {
	var self = this;
	$tw.utils.each(obj,function(value,name) {
		self.variables[name] = value;
	});
};

SimpleServer.prototype.get = function(name) {
	return this.variables[name];
};

SimpleServer.prototype.addRoute = function(route) {
	this.routes.push(route);
};

SimpleServer.prototype.listen = function(port) {
	var self = this;
	http.createServer(function(request, response) {
		// Compose the state object
		var state = {};
		state.wiki = self.wiki;
		state.server = self;
		state.urlInfo = url.parse(request.url);
		// Find the route that matches this path
		var route;
		for(var t=0; t<self.routes.length; t++) {
			var potentialRoute = self.routes[t],
				pathRegExp = potentialRoute.path,
				match = potentialRoute.path.exec(state.urlInfo.pathname);
			if(request.method === potentialRoute.method && match) {
				state.params = [];
				for(var p=1; p<match.length; p++) {
					state.params.push(match[p]);
				}
				route = potentialRoute;
				break;
			}
		}
		// Return a 404 if we didn't find a route
		if(!route) {
			response.writeHead(404);
			response.end();
			return;
		}
		// Dispatch the appropriate method
		switch(request.method) {
			case "GET": // Intentional fall-through
			case "DELETE":
				route.handler(request,response,state);
				break;
			case "PUT":
				var data = "";
				request.on("data",function(chunk) {
					data += chunk.toString();
				});
				request.on("end",function() {
					state.data = data;
					route.handler(request,response,state);
				});
				break;
		}
	}).listen(port);
};

var Command = function(params,commander,callback) {
	this.params = params;
	this.commander = commander;
	this.callback = callback;
	// Set up server
	this.server = new SimpleServer({
		wiki: this.commander.wiki
	});
	// Add route handlers
	this.server.addRoute({
		method: "PUT",
		path: /^\/recipes\/default\/tiddlers\/(.+)$/,
		handler: function(request,response,state) {
			var title = decodeURIComponent(state.params[0]),
				fields = JSON.parse(state.data);
			// Pull up any subfields in the `fields` object
			if(fields.fields) {
				$tw.utils.each(fields.fields,function(field,name) {
					fields[name] = field;
				});
				delete fields.fields;
			}
			// Remove any revision field
			if(fields["revision"]) {
				delete fields["revision"];
			}
console.log("PUT tiddler",title)
			state.wiki.addTiddler(new $tw.Tiddler(fields,{title: title}));
			var changeCount = state.wiki.getChangeCount(title).toString();
			response.writeHead(204, "OK",{
				Etag: "\"default/" + title + "/" + changeCount + ":\""
			});
			response.end();
		}
	});
	this.server.addRoute({
		method: "DELETE",
		path: /^\/bags\/default\/tiddlers\/(.+)$/,
		handler: function(request,response,state) {
			var title = decodeURIComponent(state.params[0]);
console.log("DELETE tiddler",title)
			state.wiki.deleteTiddler(title);
			response.writeHead(204, "OK");
			response.end();
		}
	});
	this.server.addRoute({
		method: "GET",
		path: /^\/$/,
		handler: function(request,response,state) {
			response.writeHead(200, {"Content-Type": state.server.get("serveType")});
			var text = state.wiki.renderTiddler(state.server.get("renderType"),state.server.get("rootTiddler"));
			response.end(text,"utf8");
		}
	});
	this.server.addRoute({
		method: "GET",
		path: /^\/status$/,
		handler: function(request,response,state) {
			response.writeHead(200, {"Content-Type": "application/json"});
			var text = JSON.stringify({
				username: "ANONYMOUS",
				space: {
					recipe: "default"
				},
				tiddlywiki_version: $tw.version
			});
			response.end(text,"utf8");
		}
	});
	this.server.addRoute({
		method: "GET",
		path: /^\/recipes\/default\/tiddlers.json$/,
		handler: function(request,response,state) {
			response.writeHead(200, {"Content-Type": "application/json"});
			var tiddlers = [];
			state.wiki.forEachTiddler("title",function(title,tiddler) {
				var tiddlerFields = {};
				$tw.utils.each(tiddler.fields,function(field,name) {
					if(name !== "text") {
						tiddlerFields[name] = tiddler.getFieldString(name);
					}
				});
				tiddlerFields["revision"] = state.wiki.getChangeCount(title);
				tiddlers.push(tiddlerFields);
			});
			var text = JSON.stringify(tiddlers);
			response.end(text,"utf8");
		}
	});
	this.server.addRoute({
		method: "GET",
		path: /^\/recipes\/default\/tiddlers\/(.+)$/,
		handler: function(request,response,state) {
			var title = decodeURIComponent(state.params[0]),
				tiddler = state.wiki.getTiddler(title),
				tiddlerFields = {},
				knownFields = [
					"bag", "created", "creator", "modified", "modifier", "permissions", "recipe", "revision", "tags", "text", "title", "type", "uri"
				];
			if(tiddler) {
				$tw.utils.each(tiddler.fields,function(field,name) {
					var value = tiddler.getFieldString(name)
					if(knownFields.indexOf(name) !== -1) {
						tiddlerFields[name] = value;
					} else {
						tiddlerFields.fields = tiddlerFields.fields || {};
						tiddlerFields.fields[name] = value;
					}
				});
				tiddlerFields["revision"] = state.wiki.getChangeCount(title);
				response.writeHead(200, {"Content-Type": "application/json"});
				response.end(JSON.stringify(tiddlerFields),"utf8");
			} else {
				response.writeHead(404);
				response.end();
			}
		}
	});
};

Command.prototype.execute = function() {
	var port = this.params[0] || "8080",
		rootTiddler = this.params[1] || "$:/core/templates/tiddlywiki5.template.html",
		renderType = this.params[2] || "text/plain",
		serveType = this.params[3] || "text/html";
	this.server.set({
		rootTiddler: rootTiddler,
		renderType: renderType,
		serveType: serveType
	});
	this.server.listen(port);
	if(this.commander.verbose) {
		console.log("Serving on port " + port);
	}
	return null;
};

exports.Command = Command;

})();
