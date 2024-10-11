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
  if(!state.authenticatedUser) {
    response.writeHead(401, "Unauthorized", { "Content-Type": "text/plain" });
    response.end("Unauthorized");
    return;
  }
  var auth = authenticator($tw);

  var userId = state.authenticatedUser.user_id;
  var currentPassword = state.data.currentPassword;
  var newPassword = state.data.newPassword;
  var confirmPassword = state.data.confirmPassword;

  if(newPassword !== confirmPassword) {
    response.setHeader("Set-Cookie", "flashMessage=New passwords do not match; Path=/; HttpOnly; Max-Age=5");
    response.writeHead(302, { "Location": "/admin/users/" + userId });
    response.end();
    return;
  }

  var userData = state.server.sqlTiddlerDatabase.getUser(userId);

  if(!userData) {
    response.setHeader("Set-Cookie", "flashMessage=User not found; Path=/; HttpOnly; Max-Age=5");
    response.writeHead(302, { "Location": "/admin/users/" + userId });
    response.end();
    return;
  }

  var isCurrentPasswordValid = auth.verifyPassword(currentPassword, userData.password);
  if(!isCurrentPasswordValid) {
    response.setHeader("Set-Cookie", "flashMessage=Current password is incorrect; Path=/; HttpOnly; Max-Age=5");
    response.writeHead(302, { "Location": "/admin/users/" + userId });
    response.end();
    return;
  }

  var newHash = auth.hashPassword(newPassword);
  var result = state.server.sqlTiddlerDatabase.updateUserPassword(userId, newHash);

  response.setHeader("Set-Cookie", `flashMessage=${result.message}; Path=/; HttpOnly; Max-Age=5`);
  response.writeHead(302, { "Location": "/admin/users/" + userId });
  response.end();
};

}());