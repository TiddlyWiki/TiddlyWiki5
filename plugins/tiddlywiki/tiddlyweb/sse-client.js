/*\
title: $:/plugins/tiddlywiki/tiddlyweb/sse-client.js
type: application/javascript
module-type: startup

GET /recipes/default/tiddlers/:title

\*/
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