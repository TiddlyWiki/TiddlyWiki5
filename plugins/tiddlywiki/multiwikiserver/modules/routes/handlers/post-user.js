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

    if(!state.authenticatedUser) {
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

    // Create new user
    var userId = sqlTiddlerDatabase.createUser(username, email, password);

    response.writeHead(302, {"Location": "/admin/users/"+userId});
    response.end();
  };

}());