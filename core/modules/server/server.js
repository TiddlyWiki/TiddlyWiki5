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
		querystring = require("querystring"),
		crypto = require("crypto"),
		zlib = require("zlib");
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
	// Initialise the variables
	this.variables = $tw.utils.extend({},this.defaultVariables);
	if(options.variables) {
		for(var variable in options.variables) {
			if(options.variables[variable]) {
				this.variables[variable] = options.variables[variable];
			}
		}
	}
	// Setup the default required plugins
	this.requiredPlugins = this.get("required-plugins").split(',');
	// Initialise CSRF
	this.csrfDisable = this.get("csrf-disable") === "yes";
	// Initialize Gzip compression
	this.enableGzip = this.get("gzip") === "yes";
	// Initialize browser-caching
	this.enableBrowserCache = this.get("use-browser-cache") === "yes";
	// Initialise authorization
	var authorizedUserName;
	if(this.get("username") && this.get("password")) {
		authorizedUserName = this.get("username");
	} else if(this.get("credentials")) {
		authorizedUserName = "(authenticated)";
	} else {
		authorizedUserName = "(anon)";
	}
	this.authorizationPrincipals = {
		readers: (this.get("readers") || authorizedUserName).split(",").map($tw.utils.trim),
		writers: (this.get("writers") || authorizedUserName).split(",").map($tw.utils.trim)
	}
	if(this.get("admin") || authorizedUserName !== "(anon)") {
		this.authorizationPrincipals["admin"] = (this.get("admin") || authorizedUserName).split(',').map($tw.utils.trim)
	}
	// Load and initialise authenticators
	$tw.modules.forEachModuleOfType("authenticator", function(title,authenticatorDefinition) {
		// console.log("Loading authenticator " + title);
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
		tlsCertFilepath = this.get("tls-cert"),
		tlsPassphrase = this.get("tls-passphrase");
	if(tlsCertFilepath && tlsKeyFilepath) {
		this.listenOptions = {
			key: fs.readFileSync(path.resolve(this.boot.wikiPath,tlsKeyFilepath),"utf8"),
			cert: fs.readFileSync(path.resolve(this.boot.wikiPath,tlsCertFilepath),"utf8"),
			passphrase: tlsPassphrase || ''
		};
		this.protocol = "https";
	}
	this.transport = require(this.protocol);
	// Name the server and init the boot state
	this.servername = $tw.utils.transliterateToSafeASCII(this.get("server-name") || this.wiki.getTiddlerText("$:/SiteTitle") || "TiddlyWiki5");
	this.boot.origin = this.get("origin")? this.get("origin"): this.protocol+"://"+this.get("host")+":"+this.get("port");
	this.boot.pathPrefix = this.get("path-prefix") || "";
}

/*
Send a response to the client. This method checks if the response must be sent
or if the client alrady has the data cached. If that's the case only a 304
response will be transmitted and the browser will use the cached data.
Only requests with status code 200 are considdered for caching.
request: request instance passed to the handler
response: response instance passed to the handler
statusCode: stauts code to send to the browser
headers: response headers (they will be augmented with an `Etag` header)
data: the data to send (passed to the end method of the response instance)
encoding: the encoding of the data to send (passed to the end method of the response instance)
*/
function sendResponse(request,response,statusCode,headers,data,encoding) {
	if(this.enableBrowserCache && (statusCode == 200)) {
		var hash = crypto.createHash('md5');
		// Put everything into the hash that could change and invalidate the data that
		// the browser already stored. The headers the data and the encoding.
		hash.update(data);
		hash.update(JSON.stringify(headers));
		if(encoding) {
			hash.update(encoding);
		}
		var contentDigest = hash.digest("hex");
		// RFC 7232 section 2.3 mandates for the etag to be enclosed in quotes
		headers["Etag"] = '"' + contentDigest + '"';
		headers["Cache-Control"] = "max-age=0, must-revalidate";
		// Check if any of the hashes contained within the if-none-match header
		// matches the current hash.
		// If one matches, do not send the data but tell the browser to use the
		// cached data.
		// We do not implement "*" as it makes no sense here.
		var ifNoneMatch = request.headers["if-none-match"];
		if(ifNoneMatch) {
			var matchParts = ifNoneMatch.split(",").map(function(etag) {
				return etag.replace(/^[ "]+|[ "]+$/g, "");
			});
			if(matchParts.indexOf(contentDigest) != -1) {
				response.writeHead(304,headers);
				response.end();
				return;
			}
		}
	} else {
		// RFC 7231, 6.1. Overview of Status Codes:
		// Browser clients may cache 200, 203, 204, 206, 300, 301, 
		// 404, 405, 410, 414, and 501 unless given explicit cache controls
		headers["Cache-Control"] = headers["Cache-Control"] || "no-store";
	}
	/*
	If the gzip=yes is set, check if the user agent permits compression. If so,
	compress our response if the raw data is bigger than 2k. Compressing less
	data is inefficient. Note that we use the synchronous functions from zlib
	to stay in the imperative style. The current `Server` doesn't depend on
	this, and we may just as well use the async versions.
	*/
	if(this.enableGzip && (data.length > 2048)) {
		var acceptEncoding = request.headers["accept-encoding"] || "";
		if(/\bdeflate\b/.test(acceptEncoding)) {
			headers["Content-Encoding"] = "deflate";
			data = zlib.deflateSync(data);
		} else if(/\bgzip\b/.test(acceptEncoding)) {
			headers["Content-Encoding"] = "gzip";
			data = zlib.gzipSync(data);
		}
	}

	response.writeHead(statusCode,headers);
	response.end(data,encoding);
}

Server.prototype.defaultVariables = {
	port: "8080",
	host: "127.0.0.1",
	"required-plugins": "$:/plugins/tiddlywiki/filesystem,$:/plugins/tiddlywiki/tiddlyweb",
	"root-tiddler": "$:/core/save/all",
	"root-render-type": "text/plain",
	"root-serve-type": "text/html",
	"tiddler-render-type": "text/html",
	"tiddler-render-template": "$:/core/templates/server/static.tiddler.html",
	"system-tiddler-render-type": "text/plain",
	"system-tiddler-render-template": "$:/core/templates/wikified-tiddler",
	"debug-level": "none",
	"gzip": "no",
	"use-browser-cache": "no"
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
	state.sendResponse = sendResponse.bind(self,request,response);
	// Get the principals authorized to access this resource
	state.authorizationType = options.authorizationType || this.methodMappings[request.method] || "readers";
	// Check for the CSRF header if this is a write
	if(!this.csrfDisable && state.authorizationType === "writers" && request.headers["x-requested-with"] !== "TiddlyWiki") {
		response.writeHead(403,"'X-Requested-With' header required to login to '" + this.servername + "'");
		response.end();
		return;
	}
	// Check whether anonymous access is granted
	state.allowAnon = this.isAuthorized(state.authorizationType,null);
	// Authenticate with the first active authenticator
	if(this.authenticators.length > 0) {
		if(!this.authenticators[0].authenticateRequest(request,response,state)) {
			// Bail if we failed (the authenticator will have sent the response)
			return;
		}
	}
	// Authorize with the authenticated username
	if(!this.isAuthorized(state.authorizationType,state.authenticatedUsername)) {
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
	var missing = [];
	for (var index=0; index<this.requiredPlugins.length; index++) {
		if (!this.wiki.getTiddler(this.requiredPlugins[index])) {
			missing.push(this.requiredPlugins[index]);
		}
	}
	if(missing.length > 0) {
		var error = "Warning: Plugin(s) required for client-server operation are missing.\n"+
			"\""+ missing.join("\", \"")+"\"";
		$tw.utils.warning(error);
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
		var address = server.address(),
			url = self.protocol + "://" + (address.family === "IPv6" ? "[" + address.address + "]" : address.address) + ":" + address.port + prefix;
		$tw.utils.log("Serving on " + url,"brown/orange");
		$tw.utils.log("(press ctrl-C to exit)","red");
	});
	// Listen
	return server.listen(port,host);
};

exports.Server = Server;

})();
