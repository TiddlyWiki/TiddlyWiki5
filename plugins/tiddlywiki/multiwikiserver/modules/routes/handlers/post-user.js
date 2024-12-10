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

function deleteTempTiddlers() {
  setTimeout(function() {
    $tw.mws.store.adminWiki.deleteTiddler("$:/temp/mws/queryParams");
    $tw.mws.store.adminWiki.deleteTiddler("$:/temp/mws/post-user/error");
    $tw.mws.store.adminWiki.deleteTiddler("$:/temp/mws/post-user/success");
  }, 1000);
}

exports.handler = function(request, response, state) {
  var current_user_id = state.authenticatedUser.user_id;
  var sqlTiddlerDatabase = state.server.sqlTiddlerDatabase;
  var username = state.data.username;
  var email = state.data.email;
  var password = state.data.password;
  var confirmPassword = state.data.confirmPassword;
  var queryParamsTiddlerTitle = "$:/temp/mws/queryParams";

  if(!state.authenticatedUser && !state.firstGuestUser) {
    $tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
      title: "$:/temp/mws/post-user/error",
      text: "Unauthorized access"
    }));
    response.writeHead(302, { "Location": "/login" });
    response.end();
    deleteTempTiddlers();
    return;
  }

  if(!username || !email || !password || !confirmPassword) {
    $tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
      title: "$:/temp/mws/post-user/error",
      text: "All fields are required"
    }));
    $tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
      title: queryParamsTiddlerTitle,
      username: username,
      email: email,
    }));
    response.writeHead(302, { "Location": "/admin/users" });
    response.end();
    deleteTempTiddlers();
    return;
  }

  if(password !== confirmPassword) {
    $tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
      title: "$:/temp/mws/post-user/error",
      text: "Passwords do not match"
    }));
    $tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
      title: "$:/temp/mws/queryParams",
      username: username,
      email: email,
    }));
    response.writeHead(302, { "Location": "/admin/users" });
    response.end();
    deleteTempTiddlers();
    return;
  }

  try {
    // Check if username or email already exists
    var existingUser = sqlTiddlerDatabase.getUserByUsername(username);
    var existingUserByEmail = sqlTiddlerDatabase.getUserByEmail(email);
    
    if(existingUser || existingUserByEmail) {
      $tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
        title: "$:/temp/mws/post-user/error",
        text: existingUser ? "User with this username already exists" : "User account with this email already exists"
      }));
      $tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
        title: queryParamsTiddlerTitle,
        username: username,
        email: email,
      }));

    $tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
      title: "$:/temp/mws/queryParams",
      username: username,
        email: email,
      }));
      response.writeHead(302, { "Location": "/admin/users" });
      response.end();
      deleteTempTiddlers();
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
        var auth = require("$:/plugins/tiddlywiki/multiwikiserver/auth/authentication.js").Authenticator;
        var authenticator = auth(sqlTiddlerDatabase);
        var sessionId = authenticator.createSession(userId);
        
        $tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
          title: "$:/temp/mws/post-user/success",
          text: "Admin user created successfully"
        }));
        response.setHeader("Set-Cookie", "session="+sessionId+"; HttpOnly; Path=/");
        response.writeHead(302, {"Location": "/"});
        response.end();
        deleteTempTiddlers();
        return;
      } catch(adminError) {
        $tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
          title: "$:/temp/mws/post-user/error",
          text: "Error creating admin user"
        }));
        $tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
          title: queryParamsTiddlerTitle,
          username: username,
          email: email,
        }));
        response.writeHead(302, { "Location": "/admin/users" });
        response.end();
        deleteTempTiddlers();
        return;
      }
    } else {
      $tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
        title: "$:/temp/mws/post-user/success",
        text: "User created successfully"
      }));
      $tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
        title: queryParamsTiddlerTitle,
        username: username,
        email: email,
      }));
      // assign role to user
      var roles = sqlTiddlerDatabase.listRoles();
      var role = roles.find(function(role) {
        return role.role_name.toUpperCase() !== "ADMIN";
      });
      if(role) {
        sqlTiddlerDatabase.addRoleToUser(userId, role.role_id);
      }
      response.writeHead(302, {"Location": "/admin/users/"+userId});
      response.end();
      deleteTempTiddlers();
    }
  } catch(error) {
    $tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
      title: "$:/temp/mws/post-user/error",
      text: "Error creating user: " + error.message
    }));
    $tw.mws.store.adminWiki.addTiddler(new $tw.Tiddler({
      title: queryParamsTiddlerTitle,
      username: username,
      email: email,
    }));
    response.writeHead(302, { "Location": "/admin/users" });
    response.end();
    deleteTempTiddlers();
    return;
  }
};

}());