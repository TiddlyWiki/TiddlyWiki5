/*\
title: $:/core/modules/server/routes/post-login-hash.js
type: application/javascript
module-type: route

GET /login-hash -- force a hash based authentication

\*/
(function() {

/*jslint node: true, browser: false */
/*global $tw: false */
"use strict";

if ($tw.node) {
	var qs = require('querystring');
}

exports.method = "POST";

exports.path = /^\/login-hash$/;

exports.isLoginPage = true;

var send = function(response, code, data, cookie) {
	var headers = {"Content-Type": "application/json"};
	if (cookie) { headers['Set-Cookie'] = cookie; }
	response.writeHead(code, headers);
	response.end(JSON.stringify(data), 'utf8');
}

exports.handler = function(request,response,state) {
	var post = qs.parse(state.data);
	if (typeof(post.user) !== 'string' || typeof(post.sid) !== 'string') {
		return send(response, 400, {error: "Invalid request"});
	}
	var info = state.pwMap[post.user];
	if (typeof(post.key) === 'undefined') {
		var salt = info ? info[1] : $tw.utils.generateUserHash(post.user);
		return send(response, 200, {salt: salt.toString('hex')});
	}
	if (info && $tw.utils.verifyPassword(post.key, post.sid, info, state.secretKey)) {
		var cookie = "a=" + $tw.utils.createCookie(post.user, state.secretKey);
		send(response, 200, {location: state.rootpath}, cookie);
	} else {
		send(response, 403, {error: 'Invalid username/password'});
	}
};

}());
