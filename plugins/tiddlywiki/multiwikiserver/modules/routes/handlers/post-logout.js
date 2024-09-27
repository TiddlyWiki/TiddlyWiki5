/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/post-logout.js
type: application/javascript
module-type: mws-route

POST /logout

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "POST";

exports.path = /^\/logout$/;

exports.csrfDisable = true;

exports.handler = function(request,response,state) {
	if(state.authenticatedUser) {
		state.server.sqlTiddlerDatabase.deleteSession(state.authenticatedUser.sessionId);
	}
	response.setHeader("Set-Cookie", "session=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT");
	response.writeHead(302, { "Location": "/login" });
	response.end();
};

}());
