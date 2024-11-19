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
    $tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
      title: "$:/temp/mws/post-user/error",
      text: "Unauthorized access"
    }));
    response.writeHead(302, { "Location": "/login" });
    response.end();
    return;
  }

  if(!username || !email || !password || !confirmPassword) {
    $tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
      title: "$:/temp/mws/post-user/error",
      text: "All fields are required"
    }));
    response.writeHead(302, { "Location": "/admin/users" });
    response.end();
    return;
  }

  if(password !== confirmPassword) {
    $tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
      title: "$:/temp/mws/post-user/error",
      text: "Passwords do not match"
    }));
    response.writeHead(302, { "Location": "/admin/users" });
    response.end();
    return;
  }

  try {
    // Check if user already exists
    var existingUser = sqlTiddlerDatabase.getUser(username);
    if(existingUser) {
      $tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
        title: "$:/temp/mws/post-user/error",
        text: "Username already exists"
      }));
      response.writeHead(302, { "Location": "/admin/users" });
      response.end();
      return;
    }

    var hasUsers = sqlTiddlerDatabase.listUsers().length > 0;
    var hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

    // Create new user
    var userId = sqlTiddlerDatabase.createUser(username, email, hashedPassword);

    if(!hasUsers) {
      try {
        // If this is the first guest user, assign admin privileges
        sqlTiddlerDatabase.setUserAdmin(userId, true);
        
        // Create a session for the new admin user
        var auth = require('$:/plugins/tiddlywiki/multiwikiserver/auth/authentication.js').Authenticator;
        var authenticator = auth(sqlTiddlerDatabase);
        var sessionId = authenticator.createSession(userId);
        
        $tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
          title: "$:/temp/mws/post-user/success",
          text: "Admin user created successfully"
        }));
        response.setHeader('Set-Cookie', `session=${sessionId}; HttpOnly; Path=/`);
        response.writeHead(302, {'Location': '/'});
        response.end();
        return;
      } catch (adminError) {
        $tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
          title: "$:/temp/mws/post-user/error",
          text: "Error creating admin user"
        }));
        response.writeHead(302, { "Location": "/admin/users" });
        response.end();
        return;
      }
    } else {
      $tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
        title: "$:/temp/mws/post-user/success",
        text: "User created successfully"
      }));
      response.writeHead(302, {"Location": "/admin/users/"+userId});
      response.end();
    }
  } catch (error) {
    $tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
      title: "$:/temp/mws/post-user/error",
      text: "Error creating user: " + error.message
    }));
    response.writeHead(302, { "Location": "/admin/users" });
    response.end();
    return;
  }
};

}());