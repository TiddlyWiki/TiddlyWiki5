/*\
title: $:/core/modules/server/server.js
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
		path = require("path");
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
	this.authenticators = options.authenticators || [];
	this.wiki = options.wiki;
	this.servername = this.wiki.getTiddlerText("$:/SiteTitle") || "TiddlyWiki5";
	// Initialise the variables
	this.variables = $tw.utils.extend({},this.defaultVariables);
	if(options.variables) {
		for(var variable in options.variables) {
			if(options.variables[variable]) {
				this.variables[variable] = options.variables[variable];
			}
		}		
	}
	$tw.utils.extend({},this.defaultVariables,options.variables);
	// Initialise CSRF
	this.csrfDisable = this.get("csrfdisable") === "yes";
	// Initialise authorization
	var authorizedUserName = (this.get("username") && this.get("password")) ? this.get("username") : "(anon)";
	this.authorizationPrincipals = {
		readers: (this.get("readers") || authorizedUserName).split(",").map($tw.utils.trim),
		writers: (this.get("writers") || authorizedUserName).split(",").map($tw.utils.trim)
	}
	// Load and initialise authenticators
	$tw.modules.forEachModuleOfType("authenticator", function(title,authenticatorDefinition) {
		// console.log("Loading server route " + title);
		self.addAuthenticator(authenticatorDefinition.AuthenticatorClass);
	});
	// Load route handlers
	$tw.modules.forEachModuleOfType("route", function(title,routeDefinition) {
		// console.log("Loading server route " + title);
		self.addRoute(routeDefinition);
	});
	// Initialise the http vs https
	this.listenOptions = {};
	this.protocol = "http";
	var tlsKeyFilepath = this.get("tlskey"),
		tlsCertFilepath = this.get("tlscert");
	if(tlsCertFilepath && tlsKeyFilepath) {
		this.listenOptions.key = fs.readFileSync(path.resolve($tw.boot.wikiPath,tlsKeyFilepath),"utf8");
		this.listenOptions.cert = fs.readFileSync(path.resolve($tw.boot.wikiPath,tlsCertFilepath),"utf8");
		this.protocol = "https";
	}
	this.transport = require(this.protocol);
}

Server.prototype.defaultVariables = {
	port: "8080",
	host: "127.0.0.1",
	roottiddler: "$:/core/save/all",
	rendertype: "text/plain",
	servetype: "text/html",
	debuglevel: "none"
};

Server.prototype.get = function(name) {
	return this.variables[name];
};

Server.prototype.addRoute = function(route) {
	this.routes.push(route);
};

Server.prototype.addAuthenticator = function(AuthenticatorClass) {
	// Instantiate and initialise the authenticator
	var authenticator = new AuthenticatorClass(this),
		result = authenticator.init();
	if(typeof result === "string") {
		$tw.utils.error("Error: " + result);
	} else if(result) {
		// Only use the authenticator if it initialised successfully
		this.authenticators.push(authenticator);
	}
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

Server.prototype.methodMappings = {
	"GET": "readers",
	"OPTIONS": "readers",
	"HEAD": "readers",
	"PUT": "writers",
	"POST": "writers",
	"DELETE": "writers"
};

/*
Check whether a given user is authorized for the specified authorizationType ("readers" or "writers"). Pass null or undefined as the username to check for anonymous access
*/
Server.prototype.isAuthorized = function(authorizationType,username) {
	var principals = this.authorizationPrincipals[authorizationType] || [];
	return principals.indexOf("(anon)") !== -1 || (username && (principals.indexOf("(authenticated)") !== -1 || principals.indexOf(username) !== -1));
}

Server.prototype.requestHandler = function(request,response) {
	// Compose the state object
	var self = this;
	var state = {};
	state.wiki = self.wiki;
	state.server = self;
	state.urlInfo = url.parse(request.url);
	// Get the principals authorized to access this resource
	var authorizationType = this.methodMappings[request.method] || "readers";
	// Check for the CSRF header if this is a write
	if(!this.csrfDisable && authorizationType === "writers" && request.headers["x-requested-with"] !== "TiddlyWiki") {
		response.writeHead(403,"'X-Requested-With' header required to login to '" + this.servername + "'");
		response.end();
		return;		
	}
	// Check whether anonymous access is enabled
	if(!this.isAuthorized(authorizationType,null)) {
		// Complain if there are no active authenticators
		if(this.authenticators.length < 1) {
			$tw.utils.error("Warning: Authentication required but no authentication modules are active");
			response.writeHead(401,"Authentication required to login to '" + this.servername + "'");
			response.end();
			return;
		}
		// Authenticate
		if(!this.authenticators[0].authenticateRequest(request,response,state)) {
			// Bail if we failed (the authenticator will have sent the response)
			return;
		}
		// Authorize with the authenticated username
		if(!this.isAuthorized(authorizationType,state.authenticatedUsername)) {
			response.writeHead(401,"'" + state.authenticatedUsername + "' is not authorized to access '" + this.servername + "'");
			response.end();
			return;
		}
	}
	// Find the route that matches this path
	var route = self.findMatchingRoute(request,state);
	// Optionally output debug info
	if(self.get("debuglevel") !== "none") {
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
	$tw.utils.log("Serving on " + this.protocol + "://" + host + ":" + port,"brown/orange");
	$tw.utils.log("(press ctrl-C to exit)","red");
	// Warn if required plugins are missing
	if(!$tw.wiki.getTiddler("$:/plugins/tiddlywiki/tiddlyweb") || !$tw.wiki.getTiddler("$:/plugins/tiddlywiki/filesystem")) {
		$tw.utils.warning("Warning: Plugins required for client-server operation (\"tiddlywiki/filesystem\" and \"tiddlywiki/tiddlyweb\") are missing from tiddlywiki.info file");
	}
	// Listen
	return this.transport.createServer(this.listenOptions,this.requestHandler.bind(this)).listen(port,host);
};

exports.Server = Server;

})();
