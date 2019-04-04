/*\
title: $:/core/modules/server/authenticators/basic.js
type: application/javascript
module-type: authenticator

Authenticator for WWW basic authentication

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
		var resolveCredentialsFilepath = path.resolve($tw.boot.wikiPath,this.credentialsFilepath);
		if(fs.existsSync(resolveCredentialsFilepath) && !fs.statSync(resolveCredentialsFilepath).isDirectory()) {
			var credentialsText = fs.readFileSync(resolveCredentialsFilepath,"utf8"),
				credentialsData = $tw.utils.parseCsvStringWithHeader(credentialsText);
			if(typeof credentialsData === "string") {
				return "Error: " + credentialsData + " reading credentials from '" + resolveCredentialsFilepath + "'";
			} else {
				this.credentialsData = credentialsData;
			}
		} else {
			return "Error: Unable to load user credentials from '" + credentialsFilepath + "'";
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



	var cookies = parseCookies(request);

	//npm install uuid TODO add to packages
	const uuid  = require('uuid');


	var date = new Date();
	//Token is invalid after 24h
	date.setDate(date.getDate() + 1);
	var timestamp = date.getTime();



	var id=uuid.v4();

	if(cookies['session.id']){
		id=cookies['session.id'];
	}
	console.log("startauth with id: "+id+" at "+timestamp);

	var name="auth.temp";
	var authfilecotent="";
	try {
		if (fs.existsSync(name)) {
			var contents = fs.readFileSync(name, 'utf8');
			console.log(contents);
			authfilecotent = contents.split(", ");
		}
	} catch(err) {
		console.error(err)
	}

	if(authfilecotent[0]===cookies['session.id']){
		console.log("session known");
		state.authenticatedUsername = cookies['session.user'];
		return true;
	}

	var headers = request.headers;
	console.log("auth user: "+headers.authuser);
	console.log("auth pass: "+headers.authpass);

	var header = request.headers.authorization || "";
	if(!header && state.allowAnon) {
		// If there's no header and anonymous access is allowed then we don't set authenticatedUsername
		return true;
	}


	// Check that at least one of the credentials matches
	var matchingCredentials = this.credentialsData.find(function(credential) {
		return credential.username === headers.authuser && credential.password === headers.authpass;
	});

	console.log("matching? "+matchingCredentials);
	if(matchingCredentials) {
		console.log("matching! "+ headers.authuser);
		authenticateUser(name, id, "", "", timestamp);
		// If so, add the authenticated username to the request state
		state.authenticatedUsername = headers.authuser;
		return true;
	} else {

		var resp="\n" +
			"<!DOCTYPE html>\n" +
			"<html>\n" +
			"<head>\n" +
			"    <title>Page Title</title>\n" +
			"</head>\n" +
			"<body>\n" +
			"\n" +
			"<h1>Tiddlywiki UIAuth</h1>\n" +
			"<p>Login</p>\n" +
			"\n" +
			"<form action=\"/\">\n" +
			"    Username<br>\n" +
			"    <input type=\"text\" id=\"user\" value=\"test\">\n" +
			"    <br>\n" +
			"    Password:<br>\n" +
			"    <input type=\"password\" id=\"passwd\" value=\"test\">\n" +
			"    <br><br>\n" +
			"</form>\n" +
			"<button onclick=\"CallWebAPI()\">Click me</button>\n" +
			"\n" +
			"\n" +
			"</body>\n" +
			"\n" +
			"<script>\n" +
			"\n" +
			"function authenticateUser(user, password)\n" +
			"{\n" +
			"    var token = user + \":\" + password;\n" +
			"\n" +
			"    // Should i be encoding this value????? does it matter???\n" +
			"    // Base64 Encoding -> btoa\n" +
			"    var hash = btoa(token);\n" +
			"\n" +
			"    return \"Basic \" + hash;\n" +
			"    }\n" +
			"\n" +
			"    function CallWebAPI() {\n" +
			"\n" +
			"    var user = document.getElementById(\"user\").value;\n" +
			"    var pass = document.getElementById(\"passwd\").value;\n" +
			"\n" +
			"    console.log(user);\n" +
			"    console.log(pass);\n" +
			"\n" +
			"    document.cookie = \"session.id="+id+"\";"+
			"    document.cookie = \"session.timestamp="+timestamp+"\";"+
			"    // New XMLHTTPRequest\n" +
			"    var request = new XMLHttpRequest();\n" +
			"    request.open(\"GET\", \"/\", false);\n" +
			"    request.setRequestHeader(\"authuser\", user);\n" +
			"    request.setRequestHeader(\"authpass\", pass);\n" +
			"    request.send();\n" +
			"    // view request status\n" +
			"    console.log(request.status);\n" +
			"    if(request.status>=200 && request.status<300){\n" +
			"    document.cookie = \"session.user=\"+user+\"\";"+
			"        var location =\n" +
			"            window.location.protocol + \"//\" +\n" +
			"            user + \":\" + pass + \"@\" +\n" +
			"            window.location.hostname +\n" +
			"            (window.location.port ? \":\" + window.location.port : \"\") +\n" +
			"            '/';\n" +
			"\n" +
			"        window.location.replace(location);\n" +
			"    }\n" +
			"    }\n" +
			"    </script>\n" +
			"    </html>"

		/*response.writeHead(401,"Authentication required",{
			"WWW-Authenticate": 'xBasic realm="Please provide your username and password to login to ' + state.server.servername + '"'
		});*/
		response.end(resp);
		//response.end();
		return false;


	}
};

function authenticateUser(location, id, name, pw, timestamp){
	fs.writeFileSync(location,id+", "+timestamp);
}


	function parseCookies (request) {
		var list = {},
			rc = request.headers.cookie;

		rc && rc.split(';').forEach(function( cookie ) {
			var parts = cookie.split('=');
			//list[parts.shift().trim()] = decodeURI(parts.join('='));
			list[parts.shift().trim()]=decodeURI(parts.join('='));
		});

		return list;
	}


exports.AuthenticatorClass = BasicAuthenticator;

})();
