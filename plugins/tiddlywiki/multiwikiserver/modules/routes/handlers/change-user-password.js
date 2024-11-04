/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/change-password.js
type: application/javascript
module-type: mws-route

POST /change-user-password

\*/
(function () {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";
var authenticator = require("$:/plugins/tiddlywiki/multiwikiserver/auth/authentication.js").Authenticator;

exports.method = "POST";

exports.path = /^\/change-user-password\/?$/;

exports.bodyFormat = "www-form-urlencoded";

exports.csrfDisable = true;

exports.handler = function (request, response, state) {
  // Clean up any existing error/success messages
  $tw.mws.store.adminWiki.deleteTiddler("$:/temp/mws/change-password/error");
  $tw.mws.store.adminWiki.deleteTiddler("$:/temp/mws/change-password/success");
  $tw.mws.store.adminWiki.deleteTiddler("$:/temp/mws/login/error");

  if(!state.authenticatedUser) {
    $tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
      title: "$:/temp/mws/login/error",
      text: "You must be logged in to change passwords"
    }));
    response.writeHead(302, { "Location": "/login" });
    response.end();
    return;
  }

  var auth = authenticator(state.server.sqlTiddlerDatabase);
  var userId = state.data.userId;
  var newPassword = state.data.newPassword;
  var confirmPassword = state.data.confirmPassword;
  var currentUserId = state.authenticatedUser.user_id;

  var hasPermission = ($tw.utils.parseInt(userId) === currentUserId) || state.authenticatedUser.isAdmin;

  if(!hasPermission) {
    $tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
      title: "$:/temp/mws/change-password/error",
      text: "You don't have permission to change this user's password"
    }));
    response.writeHead(302, { "Location": "/admin/users/" + userId });
    response.end();
    return;
  }

  if(newPassword !== confirmPassword) {
    $tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
      title: "$:/temp/mws/change-password/error",
      text: "New passwords do not match"
    }));
    response.writeHead(302, { "Location": "/admin/users/" + userId });
    response.end();
    return;
  }

  var userData = state.server.sqlTiddlerDatabase.getUser(userId);

  if(!userData) {
    $tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
      title: "$:/temp/mws/change-password/error",
      text: "User not found"
    }));
    response.writeHead(302, { "Location": "/admin/users/" + userId });
    response.end();
    return;
  }

  var newHash = auth.hashPassword(newPassword);
  var result = state.server.sqlTiddlerDatabase.updateUserPassword(userId, newHash);

  $tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
    title: "$:/temp/mws/change-password/success",
    text: result.message
  }));
  response.writeHead(302, { "Location": "/admin/users/" + userId });
  response.end();
};

}());