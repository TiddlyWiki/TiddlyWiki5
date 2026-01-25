/*\
title: $:/core/modules/server/authenticators/header.js
type: application/javascript
module-type: authenticator

Authenticator for trusted header authentication

\*/

"use strict";

function HeaderAuthenticator(server) {
	this.server = server;
	this.header = server.get("authenticated-user-header") ? server.get("authenticated-user-header").toLowerCase() : undefined;
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
	if(!username && !state.allowAnon) {
		response.writeHead(401,"Authorization header required to login to '" + state.server.servername + "'");
		response.end();
		return false;
	} else {
		// authenticatedUsername will be undefined for anonymous users
		if(username) {
			state.authenticatedUsername = $tw.utils.decodeURIComponentSafe(username);
		}
		return true;
	}
};

exports.AuthenticatorClass = HeaderAuthenticator;

