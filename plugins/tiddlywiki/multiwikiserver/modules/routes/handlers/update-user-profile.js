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
    $tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
      title: "$:/temp/mws/login/error",
      text: "You must be logged in to update profiles"
    }));
    response.writeHead(302, { "Location": "/login" });
    response.end();
    return;
  }

  var userId = state.data.userId;
  var username = state.data.username;
  var email = state.data.email;
  var roleId = state.data.role;
  var currentUserId = state.authenticatedUser.user_id;
  
  var hasPermission = ($tw.utils.parseInt(userId, 10) === currentUserId) || state.authenticatedUser.isAdmin;

  if(!hasPermission) {
    $tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
      title: "$:/temp/mws/update-profile/error",
      text: "You don't have permission to update this profile"
    }));
    response.writeHead(302, { "Location": "/admin/users/" + userId });
    response.end();
    return;
  }

  if(!state.authenticatedUser.isAdmin) {
    var userRole = state.server.sqlTiddlerDatabase.getUserRoles(userId);
    roleId = userRole.role_id;
  }

  var result = state.server.sqlTiddlerDatabase.updateUser(userId, username, email, roleId);

  if(result.success) {
    $tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
      title: "$:/temp/mws/update-profile/success",
      text: result.message
    }));
  } else {
    $tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
      title: "$:/temp/mws/update-profile/error",
      text: result.message
    }));
  }
  
  response.writeHead(302, { "Location": "/admin/users/" + userId });
  response.end();
};

}());