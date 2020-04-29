/*\
title: $:/plugins/tiddlywiki/tiddlyweb/sse-server.js
type: application/javascript
module-type: route

GET /events/plugins/tiddlywiki/tiddlyweb

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var ServerSentEvents = require("$:/core/modules/server/server-sent-events.js").ServerSentEvents;
/** @type {Record<any, {
 *   request: import("http").IncomingMessage,
 *   state,
 *   emit: (event: string, data: string) => void,
 *   end: () => void
 * }[]>} */
var wikis = {};
function setupWiki(wiki) {
  wikis[wiki] = [];
  wiki.addEventListener("change", function (changes) {
    wikis[wiki].forEach(function (item) {
      item.emit("change", JSON.stringify(changes));
    });
  });
}
var events = new ServerSentEvents("plugins/tiddlywiki/tiddlyweb", function (request, state, emit, end) {
  if (!wikis[state.wiki])
    setupWiki(state.wiki);
  wikis[state.wiki].push({ request: request, state: state, emit: emit, end: end });
});
module.exports = events.getExports();

})();