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
    state.store.adminWiki.deleteTiddler("$:/temp/mws/queryParams");
    state.store.adminWiki.deleteTiddler("$:/temp/mws/post-user/error");
    state.store.adminWiki.deleteTiddler("$:/temp/mws/post-user/success");
  }, 1000);
}
/** @type {ServerRouteHandler<0, "www-form-urlencoded">} */	
exports.handler = async function(request, response, state) {

  var sqlTiddlerDatabase = state.store.sql;
  var username = state.data.get("username");
  var email = state.data.get("email");
  var password = state.data.get("password");
  var confirmPassword = state.data.get("confirmPassword");
  var queryParamsTiddlerTitle = "$:/temp/mws/queryParams";

  if(!state.authenticatedUser && !state.firstGuestUser) {
    state.store.adminWiki.addTiddler(new $tw.Tiddler({
      title: "$:/temp/mws/post-user/error",
      text: "Unauthorized access"
    }));
    response.writeHead(302, { "Location": "/login" });
    response.end();
    deleteTempTiddlers();
    return;
  }

  if(!username || !email || !password || !confirmPassword) {
    state.store.adminWiki.addTiddler(new $tw.Tiddler({
      title: "$:/temp/mws/post-user/error",
      text: "All fields are required"
    }));
    state.store.adminWiki.addTiddler(new $tw.Tiddler({
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
    state.store.adminWiki.addTiddler(new $tw.Tiddler({
      title: "$:/temp/mws/post-user/error",
      text: "Passwords do not match"
    }));
    state.store.adminWiki.addTiddler(new $tw.Tiddler({
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
    var existingUser = await sqlTiddlerDatabase.getUserByUsername(username);
    var existingUserByEmail = await sqlTiddlerDatabase.getUserByEmail(email);
    
    if(existingUser || existingUserByEmail) {
      state.store.adminWiki.addTiddler(new $tw.Tiddler({
        title: "$:/temp/mws/post-user/error",
        text: existingUser ? "User with this username already exists" : "User account with this email already exists"
      }));
      state.store.adminWiki.addTiddler(new $tw.Tiddler({
        title: queryParamsTiddlerTitle,
        username: username,
        email: email,
      }));

    state.store.adminWiki.addTiddler(new $tw.Tiddler({
      title: "$:/temp/mws/queryParams",
      username: username,
        email: email,
      }));
      response.writeHead(302, { "Location": "/admin/users" });
      response.end();
      deleteTempTiddlers();
      return;
    }

    var hasUsers = (await sqlTiddlerDatabase.listUsers()).length > 0;
    var hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

    // Create new user
    var userId = await sqlTiddlerDatabase.createUser(username, email, hashedPassword);

    if(!hasUsers) {
      try {
        // If this is the first guest user, assign admin privileges
        await sqlTiddlerDatabase.setUserAdmin(userId);
        
        // Create a session for the new admin user
        var auth = require("$:/plugins/tiddlywiki/multiwikiserver/auth/authentication.js").Authenticator;
        var authenticator = auth(sqlTiddlerDatabase);
        var sessionId = authenticator.createSession(userId);
        
        state.store.adminWiki.addTiddler(new $tw.Tiddler({
          title: "$:/temp/mws/post-user/success",
          text: "Admin user created successfully"
        }));
        response.setHeader("Set-Cookie", "session="+sessionId+"; HttpOnly; Path=/");
        response.writeHead(302, {"Location": "/"});
        response.end();
        deleteTempTiddlers();
        return;
      } catch(adminError) {
        state.store.adminWiki.addTiddler(new $tw.Tiddler({
          title: "$:/temp/mws/post-user/error",
          text: "Error creating admin user"
        }));
        state.store.adminWiki.addTiddler(new $tw.Tiddler({
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
      state.store.adminWiki.addTiddler(new $tw.Tiddler({
        title: "$:/temp/mws/post-user/success",
        text: "User created successfully"
      }));
      state.store.adminWiki.addTiddler(new $tw.Tiddler({
        title: queryParamsTiddlerTitle,
        username: username,
        email: email,
      }));
      // assign role to user
      var roles = await sqlTiddlerDatabase.listRoles();
      var role = roles.find(function(role) {
        return role.role_name.toUpperCase() !== "ADMIN";
      });
      if(role) {
        await sqlTiddlerDatabase.addRoleToUser(userId, role.role_id);
      }
      response.writeHead(302, {"Location": "/admin/users/"+userId});
      response.end();
      deleteTempTiddlers();
    }
  } catch(error) {
    state.store.adminWiki.addTiddler(new $tw.Tiddler({
      title: "$:/temp/mws/post-user/error",
      text: "Error creating user: " + error.message
    }));
    state.store.adminWiki.addTiddler(new $tw.Tiddler({
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