/*\
title: $:/core/modules/server/routes/get-login-basic.js
type: application/javascript
module-type: route

GET /login-basic -- force a Basic Authentication challenge

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "GET";

exports.path = /^\/login-basic$/;

exports.handler = function(request,response,state) {
	if(!state.authenticatedUsername) {
		// Challenge if there's no username
		response.writeHead(401,{
			"WWW-Authenticate": 'Basic realm="Please provide your username and password to login to ' + state.server.servername + '"'
		});
		response.end();
	} else {
		// Redirect to the root wiki if login worked
		var location = ($tw.syncadaptor && $tw.syncadaptor.host)? $tw.syncadaptor.host: "/";
		response.writeHead(302,{
			Location: location
		});
		response.end();
	}
};

}());
