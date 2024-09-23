/*\
title: $:/plugins/tiddlywiki/multiwikiserver/modules/routes/helpers/acl-middleware.js
type: application/javascript
module-type: library

Middleware to handle ACL permissions

\*/

(function () {

  /*jslint node: true, browser: true */
  /*global $tw: false */
  "use strict";

  /*
  ACL Middleware factory function
  */
  exports.middleware = function (request, response, state, entityType, permissionName) {

    var server = state.server,
      sqlTiddlerDatabase = server.sqlTiddlerDatabase,
      entityName = 13;
    // Extract entity ID based on entityType
    if(entityType === "recipe") {
      entityName = state.params[0]; // Assuming recipe name is the first parameter
    } else if(entityType === "bag") {
      entityName = state.params[0]; // Adjust as needed for bag
    }
    // First, replace '%3A' with ':' to handle TiddlyWiki's system tiddlers
    var partiallyDecoded = entityName.replace(/%3A/g, ":");
    // Then use decodeURIComponent for the rest
    var decodedEntityName = decodeURIComponent(partiallyDecoded);

    // console.log("middleware =>", { entityType, permissionName, entityName, decodedEntityName })

    // Check if user is authenticated
    if(!state.authenticatedUser && !response.headersSent) {
      response.writeHead(401, "Unauthorized");
      response.end();
      return;
    }

    // Check ACL permission
    var hasPermission = sqlTiddlerDatabase.checkACLPermission(state.authenticatedUser.user_id, entityType, decodedEntityName, permissionName)
    if(!hasPermission) {
      if(!response.headersSent) {
        response.writeHead(403, "Forbidden");
        response.end();
      }
      return;
    }
  };

})();