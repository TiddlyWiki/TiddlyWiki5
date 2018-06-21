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

if($tw.node) {
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

SimpleServer.prototype.findMatchingRoute = function(request,state) {
	var pathprefix = this.get("pathprefix") || "";
	for(var t=0; t<this.routes.length; t++) {
		var potentialRoute = this.routes[t],
			pathRegExp = potentialRoute.path,
			pathname = state.urlInfo.pathname,
			match;
		if(pathprefix) {
			if(pathname.substr(0,pathprefix.length) === pathprefix) {
				pathname = pathname.substr(pathprefix.length) || "/";
				match = potentialRoute.path.exec(pathname);
			} else {
				match = false;
			}
		} else {
			match = potentialRoute.path.exec(pathname);
		}
		if(match && request.method === potentialRoute.method) {
			state.params = [];
			for(var p=1; p<match.length; p++) {
				state.params.push(match[p]);
			}
			return potentialRoute;
		}
	}
	return null;
};

SimpleServer.prototype.checkCredentials = function(request,incomingUsername,incomingPassword) {
	var header = request.headers.authorization || "",
		token = header.split(/\s+/).pop() || "",
		auth = $tw.utils.base64Decode(token),
		parts = auth.split(/:/),
		username = parts[0],
		password = parts[1];
	if(incomingUsername === username && incomingPassword === password) {
		return "ALLOWED";
	} else {
		return "DENIED";
	}
};

SimpleServer.prototype.requestHandler = function(request,response) {
	// Compose the state object
	var self = this;
	var state = {};
	state.wiki = self.wiki;
	state.server = self;
	state.urlInfo = url.parse(request.url);
	// Optionally output debug info
	if(self.get("debugLevel") !== "none") {
		console.log("Request path:",JSON.stringify(state.urlInfo));
		console.log("Request headers:",JSON.stringify(request.headers));
	}
	// Find the route that matches this path
	var route = self.findMatchingRoute(request,state);
	// Check for the username and password if we've got one
	var username = self.get("username"),
		password = self.get("password");
	if(username && password) {
		// Check they match
		if(self.checkCredentials(request,username,password) !== "ALLOWED") {
			var servername = state.wiki.getTiddlerText("$:/SiteTitle") || "TiddlyWiki5";
			response.writeHead(401,"Authentication required",{
				"WWW-Authenticate": 'Basic realm="Please provide your username and password to login to ' + servername + '"'
			});
			response.end();
			return;
		}
	}
	// Return a 404 if we didn't find a route
	if(!route) {
		response.writeHead(404);
		response.end();
		return;
	}
	// Set the encoding for the incoming request
	// TODO: Presumably this would need tweaking if we supported PUTting binary tiddlers
	request.setEncoding("utf8");
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
};
	
SimpleServer.prototype.listen = function(port,host) {
	return http.createServer(this.requestHandler.bind(this)).listen(port,host);
};

var Command = function(params,commander,callback) {
	var _this = this;
	this.params = params;
	this.commander = commander;
	this.callback = callback;
	// Set up server
	this.server = new SimpleServer({
		wiki: this.commander.wiki
	});
	// Add route handlers
	$tw.modules.forEachModuleOfType("serverroute", function(title,routeDefinition) {
		// console.log("Loading server route " + title);
		_this.server.addRoute(routeDefinition);
	});
};

Command.prototype.execute = function() {
	if(!$tw.boot.wikiTiddlersPath) {
		$tw.utils.warning("Warning: Wiki folder '" + $tw.boot.wikiPath + "' does not exist or is missing a tiddlywiki.info file");
	}
	var port = this.params[0] || "8080",
		rootTiddler = this.params[1] || "$:/core/save/all",
		renderType = this.params[2] || "text/plain",
		serveType = this.params[3] || "text/html",
		username = this.params[4],
		password = this.params[5],
		host = this.params[6] || "127.0.0.1",
		pathprefix = this.params[7],
		debugLevel = this.params[8] || "none";
	if(parseInt(port,10).toString() !== port) {
		port = process.env[port] || 8080;
	}
	this.server.set({
		rootTiddler: rootTiddler,
		renderType: renderType,
		serveType: serveType,
		username: username,
		password: password,
		pathprefix: pathprefix,
		debugLevel: debugLevel
	});
	var nodeServer = this.server.listen(port,host);
	$tw.utils.log("Serving on " + host + ":" + port,"brown/orange");
	$tw.utils.log("(press ctrl-C to exit)","red");
	// Warn if required plugins are missing
	if(!$tw.wiki.getTiddler("$:/plugins/tiddlywiki/tiddlyweb") || !$tw.wiki.getTiddler("$:/plugins/tiddlywiki/filesystem")) {
		$tw.utils.warning("Warning: Plugins required for client-server operation (\"tiddlywiki/filesystem\" and \"tiddlywiki/tiddlyweb\") are missing from tiddlywiki.info file");
	}
	$tw.hooks.invokeHook('th-server-command-post-start', this.server, nodeServer);
	return null;
};

exports.Command = Command;

})();
