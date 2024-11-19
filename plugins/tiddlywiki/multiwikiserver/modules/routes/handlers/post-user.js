/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/post-user.js
type: application/javascript
module-type: mws-route

POST /admin/post-user

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";
if($tw.node) {
	var crypto = require("crypto");
}
exports.method = "POST";

exports.path = /^\/admin\/post-user\/?$/;

exports.bodyFormat = "www-form-urlencoded";

exports.csrfDisable = true;

exports.handler = function(request, response, state) {
  var sqlTiddlerDatabase = state.server.sqlTiddlerDatabase;
  var username = state.data.username;
  var email = state.data.email;
  var password = state.data.password;
  var confirmPassword = state.data.confirmPassword;

  if(!state.authenticatedUser && !state.firstGuestUser) {
    response.writeHead(401, "Unauthorized", { "Content-Type": "text/plain" });
    response.end("Unauthorized");
    return;
  }

  if(!username || !email || !password || !confirmPassword) {
    response.writeHead(400, {"Content-Type": "application/json"});
    response.end(JSON.stringify({error: "All fields are required"}));
    return;
  }

  if(password !== confirmPassword) {
    response.writeHead(400, {"Content-Type": "application/json"});
    response.end(JSON.stringify({error: "Passwords do not match"}));
    return;
  }

  // Check if user already exists
  var existingUser = sqlTiddlerDatabase.getUser(username);
  if(existingUser) {
    response.writeHead(400, {"Content-Type": "application/json"});
    response.end(JSON.stringify({error: "Username already exists"}));
    return;
  }

  var hasUsers = sqlTiddlerDatabase.listUsers().length > 0;
	var hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

  // Create new user
  var userId = sqlTiddlerDatabase.createUser(username, email, hashedPassword);

  if(!hasUsers) {
    // If this is the first guest user, assign admin privileges
    sqlTiddlerDatabase.setUserAdmin(userId, true);
    
    // Create a session for the new admin user
    var auth = require('$:/plugins/tiddlywiki/multiwikiserver/auth/authentication.js').Authenticator;
    var authenticator = auth(sqlTiddlerDatabase);
    var sessionId = authenticator.createSession(userId);
    
    // Set the session cookie and redirect
    response.setHeader('Set-Cookie', `session=${sessionId}; HttpOnly; Path=/`);
    response.writeHead(302, {
        'Location': '/'
    });
    response.end();
    return;
  } else {
    // assign role to user
    const roles = sqlTiddlerDatabase.listRoles();
    const roleId = roles.find(role => role.role_name.toUpperCase() !== "ADMIN")?.role_id;
    if (roleId) {
      sqlTiddlerDatabase.addRoleToUser(userId, roleId);
    }
    response.writeHead(302, {"Location": "/admin/users/"+userId});
    response.end();
  }
};

}());