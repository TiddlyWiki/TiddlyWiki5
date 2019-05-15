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

exports.handler = function(request,response,state) {
	var post = qs.parse(state.data);
	if ($tw.utils.verifyPassword(post.key, post.sid, state.pwInfo) && state.user === post.user) {
		response.writeHead(200, {
			"Content-Type": "application/json",
			"Set-Cookie": "a=" + $tw.utils.createCookie(post.user, state.pwInfo.secretKey)
		});
		var text = JSON.stringify({location: state.rootpath});
		response.end(text, 'utf8');
	} else {
		response.writeHead(403, {"Content-Type": "application/json"});
		response.end(JSON.stringify({error: 'Invalid username/password'}), 'utf8');;
	}
};

}());
