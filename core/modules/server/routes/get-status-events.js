/*\
title: $:/core/modules/server/routes/get-status-events.js
type: application/javascript
module-type: route

Adds the server-sent-events server route at /status/events.

\*/
(function () {

exports.method = "GET";

exports.path = /^\/status\/events$/

exports.handler = handler;

exports.bodyFormat = "stream";

/**
 * 
 * @param {import("http").IncomingMessage} request 
 * @param {import("http").ServerResponse} response 
 * @param {ServerState} state 
 */
function handler(request, response, state) {
  
  if (request.headers.accept && request.headers.accept === 'text/event-stream') {
    $tw.serverEvents.handleConnection(request, response, state);
  } else {
    response.writeHead(404, {});
    response.write(JSON.stringify(request.headers.accept))
    response.end();
  }
}

})();
