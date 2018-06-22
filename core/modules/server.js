/*\
title: $:/core/modules/server.js
type: application/javascript
module-type: library

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

/*
A simple HTTP server with regexp-based routes
options: variables - optional hashmap of variables to set (a misnomer - they are really constant parameters)
		 routes - optional array of routes to use
		 wiki - reference to wiki object
*/
function Server(options) {
	var self = this;
	this.routes = options.routes || [];
	this.wiki = options.wiki;
	this.variables = $tw.utils.extend({},this.defaultVariables,options.variables);
	// Add route handlers
	$tw.modules.forEachModuleOfType("serverroute", function(title,routeDefinition) {
		// console.log("Loading server route " + title);
		self.addRoute(routeDefinition);
	});
}

Server.prototype.defaultVariables = {
	port: "8080",
	host: "127.0.0.1",
	rootTiddler: "$:/core/save/all",
	renderType: "text/plain",
	serveType: "text/html",
	debugLevel: "none"
};

Server.prototype.set = function(obj) {
	var self = this;
	$tw.utils.each(obj,function(value,name) {
		self.variables[name] = value;
	});
};

Server.prototype.get = function(name) {
	return this.variables[name];
};

Server.prototype.addRoute = function(route) {
	this.routes.push(route);
};

Server.prototype.findMatchingRoute = function(request,state) {
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

Server.prototype.authenticateRequestBasic = function(request,response,state) {
	if(!this.credentialsData) {
		// Authenticate as anonymous if no credentials have been specified
		return true;
	} else {
		// Extract the incoming username and password from the request
		var header = request.headers.authorization || "",
			token = header.split(/\s+/).pop() || "",
			auth = $tw.utils.base64Decode(token),
			parts = auth.split(/:/),
			incomingUsername = parts[0],
			incomingPassword = parts[1];
		// Check that at least one of the credentials matches
		var matchingCredentials = this.credentialsData.find(function(credential) {
			return credential.username === incomingUsername && credential.password === incomingPassword;
		});
		if(matchingCredentials) {
			// If so, add the authenticated username to the request state
			state.authenticatedUsername = incomingUsername;
			return true;
		} else {
			// If not, return an authentication challenge
			var servername = state.wiki.getTiddlerText("$:/SiteTitle") || "TiddlyWiki5";
			response.writeHead(401,"Authentication required",{
				"WWW-Authenticate": 'Basic realm="Please provide your username and password to login to ' + servername + '"'
			});
			response.end();
			return false;
		}
	}
};

Server.prototype.authenticateRequestByHeader = function(request,response,state) {
	var self = this,
		header = self.get("authenticatedUserHeader")
	if(!header) {
		// Authenticate as anonymous if no trusted authenticated user header is specified
		return true;
	} else {
		// Otherwise, authenticate as the username in the specified header
		var username = request.headers[header];
		if(!username) {
			var servername = state.wiki.getTiddlerText("$:/SiteTitle") || "TiddlyWiki5";
			response.writeHead(401,"Authorization header required to login to '" + servername + "'");
			response.end();
			return false;
		} else {
			state.authenticatedUsername = username;
			return true;
		}
	}
};

Server.prototype.requestHandler = function(request,response) {
	// Compose the state object
	var self = this;
	var state = {};
	state.wiki = self.wiki;
	state.server = self;
	state.urlInfo = url.parse(request.url);
	// Authenticate: provide error response on failure, add "username" to the state on success
	if(!this.authenticateRequestBasic(request,response,state) ||  !this.authenticateRequestByHeader(request,response,state)) {
		return;
	}
	// Authorize

	// Find the route that matches this path
	var route = self.findMatchingRoute(request,state);
	// Optionally output debug info
	if(self.get("debugLevel") !== "none") {
		console.log("Request path:",JSON.stringify(state.urlInfo));
		console.log("Request headers:",JSON.stringify(request.headers));
		console.log("authenticatedUsername:",state.authenticatedUsername);
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

/*
Listen for requests
port: optional port number (falls back to value of "port" variable)
host: optional host address (falls back to value of "hist" variable)
*/
Server.prototype.listen = function(port,host) {
	// Handle defaults for port and host
	port = port || this.get("port");
	host = host || this.get("host");
	// Check for the port being a string and look it up as an environment variable
	if(parseInt(port,10).toString() !== port) {
		port = process.env[port] || 8080;
	}
	$tw.utils.log("Serving on " + host + ":" + port,"brown/orange");
	$tw.utils.log("(press ctrl-C to exit)","red");
	// Warn if required plugins are missing
	if(!$tw.wiki.getTiddler("$:/plugins/tiddlywiki/tiddlyweb") || !$tw.wiki.getTiddler("$:/plugins/tiddlywiki/filesystem")) {
		$tw.utils.warning("Warning: Plugins required for client-server operation (\"tiddlywiki/filesystem\" and \"tiddlywiki/tiddlyweb\") are missing from tiddlywiki.info file");
	}
	// Read the credentials data if present
	var credentialsFilepath = this.get("credentials");
	if(credentialsFilepath) {
		credentialsFilepath = path.join($tw.boot.wikiPath,credentialsFilepath);
		if(fs.existsSync(credentialsFilepath) && !fs.statSync(credentialsFilepath).isDirectory()) {
			var credentialsText = fs.readFileSync(credentialsFilepath,"utf8"),
				credentialsData = $tw.utils.parseCsvStringWithHeader(credentialsText);
			if(typeof credentialsData === "string") {
				$tw.utils.error("Error: " + credentialsData + " reading credentials from '" + credentialsFilepath + "'");
			} else {
				this.credentialsData = credentialsData;
			}
		} else {
			$tw.utils.error("Error: Unable to load user credentials from '" + credentialsFilepath + "'");
		}
	}
	// Add the hardcoded username and password if specified
	if(this.get("username") && this.get("password")) {
		this.credentialsData = this.credentialsData || [];
		this.credentialsData.push({
			username: this.get("username"),
			password: this.get("password")
		});
	}
	return http.createServer(this.requestHandler.bind(this)).listen(port,host);
};

exports.Server = Server;

})();
