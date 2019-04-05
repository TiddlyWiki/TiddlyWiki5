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

		var appDir = path.resolve('core/modules/server/authenticators/');
		var resp=fs.readFileSync(appDir+'/template.html', 'utf8');

		resp=resp.replace('$%%ID_REPLACE%%$', id);
		resp=resp.replace('$%%TIME_REPLACE%%$', timestamp);
resp="\n" +
	"<!DOCTYPE html>\n" +
	"<html>\n" +
	"<head>\n" +
	"    <title>Tiddlywiki Authentication</title>\n" +
	"</head>\n" +
	"<style>\n" +
	"    body {\n" +
	"        background-color: linen;\n" +
	"        font-family: Arial;\n" +
	"    }\n" +
	"\n" +
	"    h1 {\n" +
	"        color: maroon;\n" +
	"        margin-left: 40px;\n" +
	"    }\n" +
	"    .test{\n" +
	"        margin: auto;\n" +
	"        width: 50%;\n" +
	"        padding: auto;\n" +
	"    }\n" +
	"\n" +
	"    input[type=text], input[type=password] {\n" +
	"        padding:5px;\n" +
	"        border:2px solid #ccc;\n" +
	"        -webkit-border-radius: 5px;\n" +
	"        border-radius: 5px;\n" +
	"        width: 100%;\n" +
	"    }\n" +
	"\n" +
	"    input[type=text]:focus, input[type=password]:focus {\n" +
	"        border-color:#333;\n" +
	"    }\n" +
	"\n" +
	"    button {\n" +
	"        padding:5px;\n" +
	"        border:2px solid #ccc;\n" +
	"        -webkit-border-radius: 5px;\n" +
	"        border-radius: 5px;\n" +
	"        width: 50%;\n" +
	"        text-align: center;\n" +
	"        text-decoration: none;\n" +
	"    }\n" +
	"\n" +
	"    .button-wrapper{\n" +
	"        display: flex;\n" +
	"        align-items: center;\n" +
	"        justify-content: center;\n" +
	"    }\n" +
	"\n" +
	"    h1 {\n" +
	"        text-align:center;\n" +
	"    }\n" +
	"\n" +
	"    .footer{\n" +
	"        position: fixed;\n" +
	"        left: 0;\n" +
	"        bottom: 0;\n" +
	"        width: 100%;\n" +
	"        text-align: center;\n" +
	"    }\n" +
	"\n" +
	"    .hidden{\n" +
	"        display: none;\n" +
	"    }\n" +
	"</style>\n" +
	"<body>\n" +
	"    <div class=\"test\">\n" +
	"        <h1>Tiddlywiki UIAuth</h1>\n" +
	"        <form action=\"/\">\n" +
	"            <input type=\"text\" id=\"user\" placeholder=\"Username\">\n" +
	"            <input type=\"password\" id=\"passwd\" placeholder=\"Password\">\n" +
	"        </form>\n" +
	"        <br>\n" +
	"        <div class=\"button-wrapper\">\n" +
	"            <button onclick=\"Login()\">Login</button>\n" +
	"        </div>\n" +
	"        <div id=\"error\" class=\"error hidden\">\n" +
	"            Password Wrong\n" +
	"        </div>\n" +
	"    </div>\n" +
	"    <div class=\"footer\">\n" +
	"        This Site uses Cookies\n" +
	"    </div>\n" +
	"</body>\n" +
	"<script>\n" +
	"    function Login() {\n" +
	"        var user = document.getElementById(\"user\").value;\n" +
	"        var pass = document.getElementById(\"passwd\").value;\n" +
	"\n" +
	"        document.cookie = \"session.id=$%%ID_REPLACE%%$\";\n" +
	"        document.cookie = \"session.timestamp=$%%TIME_REPLACE%%$\";\n" +
	"        // New XMLHTTPRequest\n" +
	"        var request = new XMLHttpRequest();\n" +
	"        request.open(\"GET\", \"/\", false);\n" +
	"        request.setRequestHeader(\"authuser\", user);\n" +
	"        request.setRequestHeader(\"authpass\", pass);\n" +
	"        request.send();\n" +
	"        // view request status\n" +
	"        if(request.status>=200 && request.status<300){\n" +
	"            document.cookie = \"session.user=\"+user;\n" +
	"            document.cookie = \"session.id=\"+request.response;\n" +
	"            var location =\n" +
	"                window.location.protocol + \"//\" +\n" +
	"                window.location.hostname +\n" +
	"                (window.location.port ? \":\" + window.location.port : \"\") +\n" +
	"                '/';\n" +
	"            window.location.replace(location);\n" +
	"        }else{\n" +
	"            document.getElementById(\"error\").classList.remove(\"hidden\");\n" +
	"            setTimeout(function() { document.getElementById(\"error\").classList.add(\"hidden\"); }, 5000);\n" +
	"        }\n" +
	"    }\n" +
	"\n" +
	"\n" +
	"</script>\n" +
	"</html>"

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
