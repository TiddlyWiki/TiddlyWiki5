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
/** @type {ServerRouteHandler<0>} */	
exports.handler = async function(request,response,state) {
	if(state.authenticatedUser) {
		await state.store.sqlTiddlerDatabase.deleteSession(state.authenticatedUser.sessionId);
	}
	var cookies = request.headers.cookie ? request.headers.cookie.split(";") : [];
	for(var i = 0; i < cookies.length; i++) {
		var cookie = cookies[i].trim().split("=")[0];
		response.setHeader("Set-Cookie", cookie + "=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict");
	}
		
	// response.setHeader("Set-Cookie", "session=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT");
	// response.setHeader("Set-Cookie", "returnUrl=; HttpOnly; Path=/");
	response.writeHead(302, { "Location": "/login" });
	response.end();
};

}());
