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

  var userId = state.authenticatedUser.user_id;
  var username = state.data.username;
  var email = state.data.email;

  var result = state.server.sqlTiddlerDatabase.updateUser(userId, username, email);

  if(result.success) {
    response.setHeader("Set-Cookie", "flashMessage="+result.mesasge+"; Path=/; HttpOnly; Max-Age=5");
    response.writeHead(302, { "Location": "/admin/users/" + userId });
  } else {
    response.setHeader("Set-Cookie", "flashMessage="+result.mesasge+"; Path=/; HttpOnly; Max-Age=5");
    response.writeHead(302, { "Location": "/admin/users/" + userId });
  }
  response.end();
};

}());