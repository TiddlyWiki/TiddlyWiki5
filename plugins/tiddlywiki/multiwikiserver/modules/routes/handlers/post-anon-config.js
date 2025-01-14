/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/post-anon-config.js
type: application/javascript
module-type: mws-route

POST /admin/post-anon-config

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "POST";

exports.path = /^\/admin\/post-anon-config\/?$/;

exports.bodyFormat = "www-form-urlencoded";

exports.csrfDisable = true;
/** @type {ServerRouteHandler<0,"www-form-urlencoded">} */	
exports.handler = async function(request, response, state) {
  // Check if user is authenticated and is admin
  if(!state.authenticatedUser || !state.authenticatedUser.isAdmin) {
    response.writeHead(401, "Unauthorized", { "Content-Type": "text/plain" });
    response.end("Unauthorized");
    return;
  }

  var allowReads = state.data.get("allowReads") === "on";
  var allowWrites = state.data.get("allowWrites") === "on";

  // Update the configuration tiddlers
  var wiki = $tw.wiki;
  wiki.addTiddler({
    title: "$:/config/MultiWikiServer/AllowAnonymousReads",
    text: allowReads ? "yes" : "no"
  });
  wiki.addTiddler({
    title: "$:/config/MultiWikiServer/AllowAnonymousWrites",
    text: allowWrites ? "yes" : "no"
  });

  wiki.addTiddler({
    title: "$:/config/MultiWikiServer/ShowAnonymousAccessModal",
    text: "no"
  });
  // Redirect back to admin page
  response.writeHead(302, {"Location": "/"});
  response.end();
};

}()); 