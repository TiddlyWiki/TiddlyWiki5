/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/update-role.js
type: application/javascript
module-type: mws-route

POST /admin/roles/:id

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "POST";

exports.path = /^\/admin\/roles\/([^\/]+)\/?$/;

exports.bodyFormat = "www-form-urlencoded";

exports.csrfDisable = true;
/** @type {ServerRouteHandler} */	
exports.handler = async function(request, response, state) {
  var sqlTiddlerDatabase = state.server.sqlTiddlerDatabase;
  var role_id = state.params[0];
  var role_name = state.data.role_name;
  var role_description = state.data.role_description;

  if(!state.authenticatedUser?.isAdmin) {
    response.writeHead(403, "Forbidden");
    response.end();
    return;
  }

  // get the role
  var role = await sqlTiddlerDatabase.getRoleById(role_id);

  if(!role) {
    response.writeHead(404, "Role not found");
    response.end();
    return;
  }

  if(role.role_name.toLowerCase().includes("admin")) {
    response.writeHead(400, "Admin role cannot be updated");
    response.end();
    return;
  }

  try {
    await sqlTiddlerDatabase.updateRole(
      role_id,
      role_name,
      role_description
    );

    response.writeHead(302, { "Location": "/admin/roles" });
    response.end();
  } catch(error) {
    console.error("Error updating role:", error);
    response.writeHead(500, "Internal Server Error");
    response.end();
  }
};

}()); 