/*\
title: $:/plugins/tiddlywiki/tiddlyweb/sse-client.js
type: application/javascript
module-type: startup

GET /recipes/default/tiddlers/:title

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "/events/plugins/tiddlywiki/tiddlyweb";
exports.after = ["startup"];
exports.synchronous = true;
exports.platforms = ["browser"];
exports.startup = function () {
  var events = new EventSource("/events/plugins/tiddlywiki/tiddlyweb");
  events.addEventListener("change", function () {
    $tw.syncer.syncFromServer();
  });
}

})();