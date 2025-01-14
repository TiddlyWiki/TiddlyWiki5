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
/** @type {ServerRouteHandler<0,"www-form-urlencoded">} */	
exports.handler = async function (request,response,state) {
  if(!state.authenticatedUser) {
    state.store.adminWiki.addTiddler(new $tw.Tiddler({
      title: "$:/temp/mws/login/error",
      text: "You must be logged in to update profiles"
    }));
    response.writeHead(302, { "Location": "/login" });
    response.end();
    return;
  }

  var userId = state.data.get("userId");
  var username = state.data.get("username");
  var email = state.data.get("email");
  var roleId = state.data.get("role");
  var currentUserId = state.authenticatedUser.user_id;

  var hasPermission = ($tw.utils.parseInt(userId) === currentUserId) || state.authenticatedUser.isAdmin;

  if(!hasPermission) {
    state.store.adminWiki.addTiddler(new $tw.Tiddler({
      title: "$:/temp/mws/update-profile/" + userId + "/error",
      text: "You don't have permission to update this profile"
    }));
    response.writeHead(302, { "Location": "/admin/users/" + userId });
    response.end();
    return;
  }

  if(!state.authenticatedUser.isAdmin) {
    var userRole = await state.store.sql.getUserRoles(userId);
    roleId = userRole.role_id;
  }

  var result = await state.store.sql.updateUser(userId, username, email, roleId);

  if(result.success) {
    state.store.adminWiki.addTiddler(new $tw.Tiddler({
      title: "$:/temp/mws/update-profile/" + userId + "/success",
      text: result.message
    }));
  } else {
    state.store.adminWiki.addTiddler(new $tw.Tiddler({
      title: "$:/temp/mws/update-profile/" + userId + "/error",
      text: result.message
    }));
  }

  response.writeHead(302, { "Location": "/admin/users/" + userId });
  response.end();
};

}());