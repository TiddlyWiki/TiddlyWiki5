/*\
title: $:/core/modules/server/authenticators/hash.js
type: application/javascript
module-type: authenticator

Authenticator for WWW basic authentication

\*/
(function(){

/*jslint node: true, browser: false */
/*global $tw: false */
"use strict";

function HashAuthenticator(server) {
	this.server = server;
}

/*
Returns true if the authenticator is active, false if it is inactive, or a string if there is an error
*/
HashAuthenticator.prototype.init = function() {
	// Read the credentials data
	var authType = this.server.get("auth-type");
	if (authType !== 'hash') {
		return false;
	}
	var secret = $tw.utils.parseSecret(this.server.get('secret-key'));
	if (typeof(secret) === 'string') {
		return secret;
	}
	var credfile = this.server.get('credentials');
	var pwMap = {};
	if (credfile) {
		pwMap = $tw.utils.loadCredentialFile(credfile);
		if (typeof(pwMap) === 'string') {
			return pwMap;
		}
	} else {
		var pwHash = this.server.get("password");
		var user = this.server.get("username");
		if (!pwHash || !user) {
			return "Expected 'credentials' or ('username' and 'password')";
		}
		pwMap[user] = $tw.utils.parsePasswordHash(pwHash);
	}

	this.secretKey = secret;
	this.rootpath = this.server.get('pathprefix') || '/';
	this.loginPath = (this.server.get('pathprefix') || '') + '/login-hash';
	this.pwMap = pwMap;
	return true;
};

/*
Returns true if the request is authenticated and assigns the "authenticatedUsername" state variable.
Returns false if the request couldn't be authenticated having sent an appropriate response to the browser
*/
HashAuthenticator.prototype.authenticateRequest = function(request,response,state) {
	var header = request.headers.cookie || "";
	var cookies = header.split(';');
	var username;
	for (var i = 0; i < cookies.length; ++i) {
		var parts = cookies[i].match(/([^=]*)=(.*)$/);
		if (parts && parts[1].trim() === "a") {
			username = $tw.utils.validateCookie(parts[2], this.secretKey);
			break;
		}
	}
	if (state.urlInfo.pathname === this.loginPath) {
		state.rootpath = this.rootpath;
		state.pwMap = this.pwMap;
		state.secretKey = this.secretKey;
	}
	if (typeof(username) === 'string') {
		state.authenticatedUsername = username;
		return true;
	} else {
		if (state.urlInfo.pathname === this.loginPath) {
			return true;
		}
		// If not, return an authentication challenge
		response.writeHead(302,"Found",{'Location': this.loginPath});
		response.end();
		return false;
	}
};

exports.AuthenticatorClass = HashAuthenticator;

})();
