/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/get-anon.js
type: application/javascript
module-type: mws-route

GET /admin/anon

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "GET";

exports.path = /^\/admin\/anon\/?$/;

exports.handler = function(request, response, state) {
  // Check if user is authenticated and is admin
  if(!state.authenticatedUser || !state.authenticatedUser.isAdmin) {
    response.writeHead(401, "Unauthorized", { "Content-Type": "text/plain" });
    response.end("Unauthorized");
    return;
  }

  
  // Update the configuration tiddlers
  var wiki = $tw.wiki;
  wiki.addTiddler({
    title: "$:/config/MultiWikiServer/AllowAnonymousReads",
    text: "undefined"
  });
  wiki.addTiddler({
    title: "$:/config/MultiWikiServer/AllowAnonymousWrites",
    text: "undefined"
  });

  // Redirect back to admin page
  response.writeHead(302, {"Location": "/"});
  response.end();
};

}()); 