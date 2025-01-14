/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/helpers/acl-middleware.js
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
/**
 * 
 * @param {IncomingMessage} request 
 * @param {ServerResponse} response 
 * @param {ServerState} state 
 * @param {string | null} entityType 
 * @param {string} permissionName 
 * @returns 
 */
exports.middleware = async function middleware(request, response, state, entityType, permissionName) {
  var extensionRegex = /\.[A-Za-z0-9]{1,4}$/;

	var
		sqlTiddlerDatabase = state.store.sql,
		entityName = state.data ? (state.data[entityType+"_name"] || state.params[0]) : state.params[0];

	// First, replace '%3A' with ':' to handle TiddlyWiki's system tiddlers
	var partiallyDecoded = entityName?.replace(/%3A/g, ":");
	// Then use decodeURIComponent for the rest
	var decodedEntityName = decodeURIComponent(partiallyDecoded);
	var aclRecord = await sqlTiddlerDatabase.getACLByName(entityType, decodedEntityName);
	var isGetRequest = request.method === "GET";
	var hasAnonymousAccess = state.allowAnon ? (isGetRequest ? state.allowAnonReads : state.allowAnonWrites) : false;
	var anonymousAccessConfigured = state.anonAccessConfigured;
	var entity = await sqlTiddlerDatabase.getEntityByName(entityType, decodedEntityName);
	var isAdmin = state.authenticatedUser?.isAdmin;

	if(isAdmin) {
		return;
	}

	if(entity?.owner_id) {
		if(state.authenticatedUser?.user_id && (state.authenticatedUser?.user_id !== entity.owner_id) || !state.authenticatedUser?.user_id && !hasAnonymousAccess) {
			const hasPermission = state.authenticatedUser?.user_id ? 
				entityType === 'recipe' ? await sqlTiddlerDatabase.hasRecipePermission(state.authenticatedUser?.user_id, decodedEntityName, isGetRequest ? 'READ' : 'WRITE')
				: await sqlTiddlerDatabase.hasBagPermission(state.authenticatedUser?.user_id, decodedEntityName, isGetRequest ? 'READ' : 'WRITE')
				: false
			if(!response.headersSent && !hasPermission) {
				response.writeHead(403, "Forbidden");
				response.end();
			}
			return;
		}
	} else {
		// First, we need to check if anonymous access is allowed
		if(!state.authenticatedUser?.user_id && (anonymousAccessConfigured && !hasAnonymousAccess)) {
			if(!response.headersSent && !extensionRegex.test(request.url)) {
				response.writeHead(401, "Unauthorized");
				response.end();
			}
			return;
		} else {
			// Get permission record
			const permission = await sqlTiddlerDatabase.getPermissionByName(permissionName);
			// ACL Middleware will only apply if the entity has a middleware record
			if(aclRecord && aclRecord?.permission_id === permission?.permission_id) {
				// If not authenticated and anonymous access is not allowed, request authentication
				if(!state.authenticatedUsername && !state.allowAnon) {
					if(state.urlInfo.pathname !== '/login') {
						redirectToLogin(response, request.url);
						return;
					}
				}
			}

			// Check ACL permission
			var hasPermission = request.method === "POST"
				|| await sqlTiddlerDatabase.checkACLPermission(
					state.authenticatedUser?.user_id, 
					entityType, 
					decodedEntityName, 
					permissionName, 
					entity?.owner_id
				);

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