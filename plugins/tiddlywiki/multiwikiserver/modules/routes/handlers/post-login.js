/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/post-login.js
type: application/javascript
module-type: mws-route

POST /login

Parameters:

username
password

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";
var authenticator = require("$:/plugins/tiddlywiki/multiwikiserver/auth/authentication.js").Authenticator;

exports.method = "POST";

exports.path = /^\/login$/;

exports.bodyFormat = "www-form-urlencoded";

exports.csrfDisable = true;
/** @type {ServerRouteHandler} */	
exports.handler = async function(request,response,state) {
	var auth = authenticator(state.server.sqlTiddlerDatabase);
	var username = state.data.username;
	var password = state.data.password;
	var user = await state.server.sqlTiddlerDatabase.getUserByUsername(username);
	var isPasswordValid = auth.verifyPassword(password, user ? user.password : null)

	if(user && isPasswordValid) {
		var sessionId = auth.createSession(user.user_id);
		var returnUrl = state.server.parseCookieString(request.headers.cookie).returnUrl
		response.setHeader("Set-Cookie", `session=${sessionId}; HttpOnly; Path=/`);
		if(request.headers.accept && request.headers.accept.indexOf("application/json") !== -1) {
			state.sendResponse(200,{"Content-Type": "application/json"},JSON.stringify({
				"sessionId": sessionId
			}));
		} else {
			response.writeHead(302, {
				"Location": returnUrl || "/"
			});
		}
	} else {
		$tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
			title: "$:/temp/mws/login/error",
			text: "Invalid username or password"
		}));
		if(request.headers.accept && request.headers.accept.indexOf("application/json") !== -1) {
			state.sendResponse(200,{"Content-Type": "application/json"},JSON.stringify({
				"message": "Invalid username or password"
			}));
		} else {
			response.writeHead(302, {
				"Location": "/login"
			});
		}
	}
	response.end();
};

}());
