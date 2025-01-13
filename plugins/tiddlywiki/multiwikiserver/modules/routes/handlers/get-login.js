/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/get-login.js
type: application/javascript
module-type: mws-route

GET /login

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "GET";

exports.path = /^\/login$/;
/** @type {ServerRouteHandler<0>} */	
exports.handler = async function(request,response,state) {
	// Check if the user already has a valid session
	var authenticatedUser = await state.server.authenticateUser(request, response);
	if(authenticatedUser) {
			// User is already logged in, redirect to home page
			response.writeHead(302, { "Location": "/" });
			response.end();
			return;
	}
	var loginTiddler = state.store.adminWiki.getTiddler("$:/plugins/tiddlywiki/multiwikiserver/auth/form/login");
	if(loginTiddler) {
		var text = state.store.adminWiki.renderTiddler("text/html", loginTiddler.fields.title);
		response.writeHead(200, { "Content-Type": "text/html" });
		response.end(text);
	} else {
		response.writeHead(404);
		response.end("Login page not found");
	}
};

}());
