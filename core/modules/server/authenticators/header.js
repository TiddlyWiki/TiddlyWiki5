/*\
title: $:/core/modules/server/authenticators/header.js
type: application/javascript
module-type: authenticator

Authenticator for trusted header authentication

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function HeaderAuthenticator(server) {
	this.server = server;
	this.header = server.get("authenticateduserheader");
}

/*
Returns true if the authenticator is active, false if it is inactive, or a string if there is an error
*/
HeaderAuthenticator.prototype.init = function() {
	return !!this.header;
};

/*
Returns true if the request is authenticated and assigns the "authenticatedUsername" state variable.
Returns false if the request couldn't be authenticated having sent an appropriate response to the browser
*/
HeaderAuthenticator.prototype.authenticateRequest = function(request,response,state) {
	// Otherwise, authenticate as the username in the specified header
	var username = request.headers[this.header];
	if(!username) {
		var servername = state.wiki.getTiddlerText("$:/SiteTitle") || "TiddlyWiki5";
		response.writeHead(401,"Authorization header required to login to '" + state.server.servername + "'");
		response.end();
		return false;
	} else {
		state.authenticatedUsername = username;
		return true;
	}
};

exports.AuthenticatorClass = HeaderAuthenticator;

})();
