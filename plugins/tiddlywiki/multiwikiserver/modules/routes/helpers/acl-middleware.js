/*\
title: $:/plugins/tiddlywiki/multiwikiserver/modules/routes/helpers/acl-middleware.js
type: application/javascript
module-type: library

Middleware to handle ACL permissions

\*/

(function () {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
ACL Middleware factory function
*/
function redirectToLogin(response, returnUrl) {
	if(!response.headersSent) {
		var validReturnUrlRegex = /^\/(?!.*\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot|json)$).*$/;
		var sanitizedReturnUrl = '/';  // Default to home page

		if(validReturnUrlRegex.test(returnUrl)) {
			sanitizedReturnUrl = returnUrl;
			response.setHeader('Set-Cookie', `returnUrl=${encodeURIComponent(sanitizedReturnUrl)}; HttpOnly; Secure; SameSite=Strict; Path=/`);			
		} else{
			console.log(`Invalid return URL detected: ${returnUrl}. Redirecting to home page.`);
		}
		const loginUrl = '/login';
		response.writeHead(302, {
			'Location': loginUrl
		});
		response.end();
	}
};

exports.middleware = function (request, response, state, entityType, permissionName) {

	var server = state.server,
		sqlTiddlerDatabase = server.sqlTiddlerDatabase,
		entityName = state.data ? (state.data[entityType+"_name"] || state.params[0]) : state.params[0];

	// First, replace '%3A' with ':' to handle TiddlyWiki's system tiddlers
	var partiallyDecoded = entityName?.replace(/%3A/g, ":");
	// Then use decodeURIComponent for the rest
	var decodedEntityName = decodeURIComponent(partiallyDecoded);
	var aclRecord = sqlTiddlerDatabase.getACLByName(entityType, decodedEntityName);
	var isGetRequest = request.method === "GET";
	var hasAnonymousAccess = isGetRequest ? state.allowAnonReads : state.allowAnonWrites;
	var entity = sqlTiddlerDatabase.getEntityByName(entityType, decodedEntityName);
	if(entity?.owner_id) {
		if(state.authenticatedUser?.user_id !== entity.owner_id) {
			if(!response.headersSent) {
				response.writeHead(403, "Forbidden");
				response.end();
			}
			return;
		}
	} else {
		// Get permission record
		const permission = sqlTiddlerDatabase.getPermissionByName(permissionName);
		// ACL Middleware will only apply if the entity has a middleware record
		if(aclRecord && aclRecord?.permission_id === permission?.permission_id) {
			// If not authenticated and anonymous access is not allowed, request authentication
			if(!state.authenticatedUsername && !state.allowAnon) {
				if(state.urlInfo.pathname !== '/login') {
					redirectToLogin(response, request.url);
					return;
				}
			}
			// Check if user is authenticated
			if(!state.authenticatedUser && !hasAnonymousAccess && !response.headersSent) {
				response.writeHead(401, "Unauthorized");
				response.end();
				return;
			}

			// Check ACL permission
			var hasPermission = request.method === "POST" || sqlTiddlerDatabase.checkACLPermission(state.authenticatedUser.user_id, entityType, decodedEntityName, permissionName)
			if(!hasPermission && !hasAnonymousAccess) {
				if(!response.headersSent) {
					response.writeHead(403, "Forbidden");
					response.end();
				}
				return;
			}
		}
	}
};

})();