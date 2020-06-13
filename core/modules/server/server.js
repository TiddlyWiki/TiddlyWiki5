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
		path = require("path"),
		querystring = require("querystring");
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
	this.boot = options.boot || $tw.boot;
	this.servername = $tw.utils.transliterateToSafeASCII(this.wiki.getTiddlerText("$:/SiteTitle") || "TiddlyWiki5");
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
	this.csrfDisable = this.get("csrf-disable") === "yes";
	// Initialize Gzip compression
	this.enableGzip = this.get("gzip") === "yes";
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
	this.listenOptions = null;
	this.protocol = "http";
	var tlsKeyFilepath = this.get("tls-key"),
		tlsCertFilepath = this.get("tls-cert");
	if(tlsCertFilepath && tlsKeyFilepath) {
		this.listenOptions = {
			key: fs.readFileSync(path.resolve(this.boot.wikiPath,tlsKeyFilepath),"utf8"),
			cert: fs.readFileSync(path.resolve(this.boot.wikiPath,tlsCertFilepath),"utf8")
		};
		this.protocol = "https";
	}
	this.transport = require(this.protocol);
}

Server.prototype.defaultVariables = {
	port: "8080",
	host: "127.0.0.1",
	"root-tiddler": "$:/core/save/all",
	"root-render-type": "text/plain",
	"root-serve-type": "text/html",
	"tiddler-render-type": "text/html",
	"tiddler-render-template": "$:/core/templates/server/static.tiddler.html",
	"system-tiddler-render-type": "text/plain",
	"system-tiddler-render-template": "$:/core/templates/wikified-tiddler",
	"debug-level": "none",
	"gzip": "no"
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
	for(var t=0; t<this.routes.length; t++) {
		var potentialRoute = this.routes[t],
			pathRegExp = potentialRoute.path,
			pathname = state.urlInfo.pathname,
			match;
		if(state.pathPrefix) {
			if(pathname.substr(0,state.pathPrefix.length) === state.pathPrefix) {
				pathname = pathname.substr(state.pathPrefix.length) || "/";
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

Server.prototype.requestHandler = function(request,response,options) {
	options = options || {};
	// Compose the state object
	var self = this;
	var state = {};
	state.wiki = options.wiki || self.wiki;
	state.boot = options.boot || self.boot;
	state.server = self;
	state.urlInfo = url.parse(request.url);
	state.queryParameters = querystring.parse(state.urlInfo.query);
	state.pathPrefix = options.pathPrefix || this.get("path-prefix") || "";
	// Get the principals authorized to access this resource
	var authorizationType = this.methodMappings[request.method] || "readers";
	// Check for the CSRF header if this is a write
	if(!this.csrfDisable && authorizationType === "writers" && request.headers["x-requested-with"] !== "TiddlyWiki") {
		response.writeHead(403,"'X-Requested-With' header required to login to '" + this.servername + "'");
		response.end();
		return;		
	}
	// Check whether anonymous access is granted
	state.allowAnon = this.isAuthorized(authorizationType,null);
	// Authenticate with the first active authenticator
	if(this.authenticators.length > 0) {
		if(!this.authenticators[0].authenticateRequest(request,response,state)) {
			// Bail if we failed (the authenticator will have sent the response)
			return;
		}		
	}
	// Authorize with the authenticated username
	if(!this.isAuthorized(authorizationType,state.authenticatedUsername)) {
		response.writeHead(401,"'" + state.authenticatedUsername + "' is not authorized to access '" + this.servername + "'");
		response.end();
		return;
	}
	// Find the route that matches this path
	var route = self.findMatchingRoute(request,state);
	// Optionally output debug info
	if(self.get("debug-level") !== "none") {
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
	// Receive the request body if necessary and hand off to the route handler
	if(route.bodyFormat === "stream" || request.method === "GET" || request.method === "HEAD") {
		// Let the route handle the request stream itself
		route.handler(request,response,state);
	} else if(route.bodyFormat === "string" || !route.bodyFormat) {
		// Set the encoding for the incoming request
		request.setEncoding("utf8");
		var data = "";
		request.on("data",function(chunk) {
			data += chunk.toString();
		});
		request.on("end",function() {
			state.data = data;
			route.handler(request,response,state);
		});
	} else if(route.bodyFormat === "buffer") {
		var data = [];
		request.on("data",function(chunk) {
			data.push(chunk);
		});
		request.on("end",function() {
			state.data = Buffer.concat(data);
			route.handler(request,response,state);
		})
	} else {
		response.writeHead(400,"Invalid bodyFormat " + route.bodyFormat + " in route " + route.method + " " + route.path.source);
		response.end();
	}
};

/*
Listen for requests
port: optional port number (falls back to value of "port" variable)
host: optional host address (falls back to value of "host" variable)
prefix: optional prefix (falls back to value of "path-prefix" variable)
*/
Server.prototype.listen = function(port,host,prefix) {
	var self = this;
	// Handle defaults for port and host
	port = port || this.get("port");
	host = host || this.get("host");
	prefix = prefix || this.get("path-prefix") || "";
	// Check for the port being a string and look it up as an environment variable
	if(parseInt(port,10).toString() !== port) {
		port = process.env[port] || 8080;
	}
	// Warn if required plugins are missing
	if(!this.wiki.getTiddler("$:/plugins/tiddlywiki/tiddlyweb") || !this.wiki.getTiddler("$:/plugins/tiddlywiki/filesystem")) {
		$tw.utils.warning("Warning: Plugins required for client-server operation (\"tiddlywiki/filesystem\" and \"tiddlywiki/tiddlyweb\") are missing from tiddlywiki.info file");
	}
	// Create the server
	var server;
	if(this.listenOptions) {
		server = this.transport.createServer(this.listenOptions,this.requestHandler.bind(this));
	} else {
		server = this.transport.createServer(this.requestHandler.bind(this));
	}
	// Display the port number after we've started listening (the port number might have been specified as zero, in which case we will get an assigned port)
	server.on("listening",function() {
		var address = server.address();
		$tw.utils.log("Serving on " + self.protocol + "://" + address.address + ":" + address.port + prefix,"brown/orange");
		$tw.utils.log("(press ctrl-C to exit)","red");
	});
	// Listen
	return server.listen(port,host);
};

exports.Server = Server;

})();
