/*\
title: $:/core/modules/server/authenticators/basic.js
type: application/javascript
module-type: authenticator

Authenticator for WWW basic authentication

\*/

"use strict";

if($tw.node) {
	const util = require("util");
	var fs = require("fs");
	const url = require("url");
	var path = require("path");
}

function BasicAuthenticator(server) {
	this.server = server;
	this.credentialsData = [];
}

/*
Returns true if the authenticator is active, false if it is inactive, or a string if there is an error
*/
BasicAuthenticator.prototype.init = function() {
	// Read the credentials data
	this.credentialsFilepath = this.server.get("credentials");
	if(this.credentialsFilepath) {
		const resolveCredentialsFilepath = path.resolve(this.server.boot.wikiPath,this.credentialsFilepath);
		if(fs.existsSync(resolveCredentialsFilepath) && !fs.statSync(resolveCredentialsFilepath).isDirectory()) {
			const credentialsText = fs.readFileSync(resolveCredentialsFilepath,"utf8");
			const credentialsData = $tw.utils.parseCsvStringWithHeader(credentialsText);
			if(typeof credentialsData === "string") {
				return `Error: ${credentialsData} reading credentials from '${resolveCredentialsFilepath}'`;
			} else {
				this.credentialsData = credentialsData;
			}
		} else {
			return `Error: Unable to load user credentials from '${resolveCredentialsFilepath}'`;
		}
	}
	// Add the hardcoded username and password if specified
	if(this.server.get("username") && this.server.get("password")) {
		this.credentialsData = this.credentialsData || [];
		this.credentialsData.push({
			username: this.server.get("username"),
			password: this.server.get("password")
		});
	}
	return this.credentialsData.length > 0;
};

/*
Returns true if the request is authenticated and assigns the "authenticatedUsername" state variable.
Returns false if the request couldn't be authenticated having sent an appropriate response to the browser
*/
BasicAuthenticator.prototype.authenticateRequest = function(request,response,state) {
	// Extract the incoming username and password from the request
	const header = request.headers.authorization || "";
	if(!header && state.allowAnon) {
		// If there's no header and anonymous access is allowed then we don't set authenticatedUsername
		return true;
	}
	const token = header.split(/\s+/).pop() || "";
	const auth = $tw.utils.base64Decode(token);
	const parts = auth.split(/:/);
	const incomingUsername = parts[0];
	const incomingPassword = parts[1];
	// Check that at least one of the credentials matches
	const matchingCredentials = this.credentialsData.find((credential) => {
		return credential.username === incomingUsername && credential.password === incomingPassword;
	});
	if(matchingCredentials) {
		// If so, add the authenticated username to the request state
		state.authenticatedUsername = incomingUsername;
		return true;
	} else {
		// If not, return an authentication challenge
		response.writeHead(401,"Authentication required",{
			"WWW-Authenticate": `Basic realm="Please provide your username and password to login to ${state.server.servername}"`
		});
		response.end();
		return false;
	}
};

exports.AuthenticatorClass = BasicAuthenticator;
