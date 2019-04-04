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

    cleanAuthfile();
	const uuid  = require('uuid');

	var date = new Date();
	//Token is invalid after 24h
	date.setDate(date.getDate() + 1);
	var timestamp = date.getTime();

	var id=uuid.v4();

	var cookies = parseCookies(request);
	if(cookies['session.id']){
		id=cookies['session.id'];
	}

	if(checkUserID(cookies['session.id'])){
		state.authenticatedUsername = cookies['session.user'];
		return true;
	}

	var headers = request.headers;

	var header = request.headers.authorization || "";
	if(!header && state.allowAnon) {
		// If there's no header and anonymous access is allowed then we don't set authenticatedUsername
		return true;
	}

	// Check that at least one of the credentials matches
	var matchingCredentials = this.credentialsData.find(function(credential) {
		return credential.username === headers.authuser && credential.password === headers.authpass;
	});

	//console.log("matching? "+matchingCredentials);
	if(matchingCredentials) {
		//console.log("matching! "+ headers.authuser);
		//create new uuid to authenticate the client
		id=uuid.v4();
		authenticateUser(id,  timestamp, headers.authuser);
		//send new id as content to the client
		response.end(id);
		// If so, add the authenticated username to the request state
		state.authenticatedUsername = headers.authuser;
		return true;
	} else {
		if(headers.authuser || headers.authpass){
			response.writeHead(406,"Wrong Password");
			response.end();
			return false;
		}

		id=uuid.v4();
		timestamp = date.getTime();

		var resp=fs.readFileSync('core/modules/server/authenticators/template.html', 'utf8');

		resp=resp.replace('$%%ID_REPLACE%%$', id);
		resp=resp.replace('$%%TIME_REPLACE%%$', timestamp);

		response.end(resp);
		return false;


	}
};



function filename() {
	return "auth.temp";
}

function authenticateUser(id, timestamp, name){
    try {
        fs.appendFileSync(filename(),id+", "+timestamp+", "+name+"\n");
    } catch(err) {
        console.error(err)
    }
}

function checkUserID(id){
	var userarray = getAuthFile();
	var now = new Date().getTime();

	if(typeof userarray[id] !== 'undefined'){
		if(now<userarray[id].timestamp){
			return true;
		}
	}
	return false;
}

function getAuthFile() {
	var content=[];
	try {
		if (fs.existsSync(filename())) {
			var contents = fs.readFileSync(filename(), 'utf8');
			content = contents.replace(/\r\n/g,'\n').split('\n');
		}
	} catch(err) {
		console.error(err)
	}

	var authentries=[];
	for (var index = 0; index < content.length; ++index) {

		var entry=content[index].split(', ');
		var obj = new Object();

		obj.id=entry[0];
		obj.timestamp=entry[1];
		authentries[obj.id]=obj;
	}

	return authentries;
}

function cleanAuthfile() {//writeFile
	var content=[];
	try {
		if (fs.existsSync(filename())) {
			var contents = fs.readFileSync(filename(), 'utf8');
			content = contents.replace(/\r\n/g,'\n').split('\n');
		}
	} catch(err) {
		console.error(err)
	}

	//delete file after retrieving it
	var now = new Date().getTime();
	var newfile="";
	for (var index = 0; index < content.length; ++index) {

		var entry=content[index].split(', ');
		if(now < entry[1]){
            var t = entry[0]+", "+entry[1]+", "+entry[2]+"\n";
            newfile=newfile.concat(t);
		}
	}

    try {
	    if (fs.existsSync('auth.temp')) {
	        fs.unlinkSync('auth.temp');
	    }
        fs.writeFileSync(filename(),newfile);
    } catch(err) {
        console.error(err)
    }
}

function parseCookies (request) {
	var list = {}, rc = request.headers.cookie;

	rc && rc.split(';').forEach(function( cookie ) {
		var parts = cookie.split('=');
		//list[parts.shift().trim()] = decodeURI(parts.join('='));
		list[parts.shift().trim()]=decodeURI(parts.join('='));
	});

	return list;
}


exports.AuthenticatorClass = BasicAuthenticator;

})();
