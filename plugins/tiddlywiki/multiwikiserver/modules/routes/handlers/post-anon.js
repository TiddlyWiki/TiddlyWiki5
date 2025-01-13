/*\
title: $:/plugins/tiddlywiki/multiwikiserver/routes/handlers/post-anon.js
type: application/javascript
module-type: mws-route

POST /admin/anon

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.method = "POST";

exports.path = /^\/admin\/anon\/?$/;

exports.bodyFormat = "www-form-urlencoded";

exports.csrfDisable = true;
/** @type {ServerRouteHandler<0,"www-form-urlencoded">} */	
// eslint-disable-next-line require-await
exports.handler = async function(request, response, state) {
  // Check if user is authenticated and is admin
  if(!state.authenticatedUser || !state.authenticatedUser.isAdmin) {
    response.writeHead(401, "Unauthorized", { "Content-Type": "text/plain" });
    response.end("Unauthorized");
    return;
  }

  
  // Update the configuration tiddlers
  $tw.wiki.addTiddler({
    title: "$:/config/MultiWikiServer/ShowAnonymousAccessModal",
    text: "yes"
  });

  // Redirect back to admin page
  response.writeHead(302, {"Location": "/"});
  response.end();
};

}()); 