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

/** @type {any[]} */
var wikis = [];
/** @type {{
 *   request: import("http").IncomingMessage,
 *   state: {wiki,pathPrefix},
 *   emit: (event: string, data: string) => void,
 *   end: () => void
 * }[][]} */
var conns = [];
/**
 * Setups up the array for this wiki and adds the change listener
 * 
 * @param {$tw.Wiki} wiki The wiki object to listen to changes on
 */
function setupWiki(wiki) {
  var index = wikis.length;
  var connections = [];
  // add a new array for this wiki (object references work as keys)
  wikis.push(wiki);
  conns.push(connections);
  // add the change listener for this wiki
  wiki.addEventListener("change", function(changes) {
    connections.forEach(function(item) {
      item.emit("change", JSON.stringify(changes));
    });
  });
  return index;
}
/**
 * 
 * @param {import("http").IncomingMessage} request 
 * @param {{wiki,pathPrefix}} state 
 * @param {(event: string, data: string) => void} emit 
 * @param {() => void} end 
 */
function handleConnection(request, state, emit, end) {
  var index = wikis.indexOf(state.wiki);
  // setup this particular wiki if we haven't seen it before
  if (index === -1) index = setupWiki(state.wiki);
  // add the connection to the list of connections for this wiki
  var item = { request: request, state: state, emit: emit, end: end };
  conns[index].push(item);
  // remove the connection when it closes
  request.on("close",function(){
    var remIndex = conns[index].indexOf(item);
    if(remIndex > -1) conns[index].splice(remIndex,1);
  });
}
// import the ServerSentEvents class
var ServerSentEvents = require("$:/core/modules/server/server-sent-events.js").ServerSentEvents;
// instantiate the class
var events = new ServerSentEvents("plugins/tiddlywiki/tiddlyweb", handleConnection);
// export the route definition for this server sent events instance
module.exports = events.getExports();

})();