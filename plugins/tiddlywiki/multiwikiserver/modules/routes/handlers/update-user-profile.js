/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/update-profile.js
type: application/javascript
module-type: mws-route

POST /update-user-profile

\*/
(function () {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "POST";

exports.path = /^\/update-user-profile\/?$/;

exports.bodyFormat = "www-form-urlencoded";

exports.csrfDisable = true;

exports.handler = function (request,response,state) {
  if(!state.authenticatedUser) {
    response.writeHead(401, "Unauthorized", { "Content-Type": "text/plain" });
    response.end("Unauthorized");
    return;
  }

  var userId = state.data.userId;
  var username = state.data.username;
  var email = state.data.email;
  var roleId = state.data.role;
  var currentUserId = state.authenticatedUser.user_id;
  
  var hasPermission = ($tw.utils.parseInt(userId, 10) === currentUserId) || state.authenticatedUser.isAdmin;

  if(!hasPermission) {
    response.writeHead(403, "Forbidden", { "Content-Type": "text/plain" });
    response.end("Forbidden");
    return;
  }

  if(!state.authenticatedUser.isAdmin) {
		var userRole = state.server.sqlTiddlerDatabase.getUserRoles(userId);
    roleId = userRole.role_id;
  }

  var result = state.server.sqlTiddlerDatabase.updateUser(userId, username, email, roleId);

  if(result.success) {
    response.setHeader("Set-Cookie", "flashMessage="+result.message+"; Path=/; HttpOnly; Max-Age=5");
    response.writeHead(302, { "Location": "/admin/users/" + userId });
  } else {
    response.setHeader("Set-Cookie", "flashMessage="+result.message+"; Path=/; HttpOnly; Max-Age=5");
    response.writeHead(302, { "Location": "/admin/users/" + userId });
  }
  response.end();
};

}());