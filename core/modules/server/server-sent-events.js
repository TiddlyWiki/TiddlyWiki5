/*\
title: $:/core/modules/server/server-sent-events.js
type: application/javascript
module-type: library
\*/
class ServerSentEvents {
  /**
   * @param {string} prefix 
   * Usually the plugin path, such as `plugins/tiddlywiki/tiddlyweb`. 
   * The route will match `/events/${prefix}` exactly.
   * @param {(
   *   request: import("http").IncomingMessage, 
   *   state, 
   *   emit: (event: string, data: string) => void, 
   *   end: () => void
   * ) => void} handler 
   * A function that will be called each time a request 
   * comes in with the request and state from the 
   * route and an emit function to call.
   */
  constructor(prefix, handler) {
    this.handler = handler;
    this.prefix = prefix;
  }
  getExports() {
    return {
      bodyFormat: "stream",
      method: "GET",
      path: new RegExp("^/events/" + this.prefix + "$"),
      handler: this.handleEventRequest.bind(this)
    }
  }
  /**
   * 
   * @param {import("http").IncomingMessage} request 
   * @param {import("http").ServerResponse} response 
   * @param {*} state 
   */
  handleEventRequest(request, response, state) {
    if (request.headers.accept && request.headers.accept.startsWith('text/event-stream')) {
      response.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      response.write("\n", "utf8");
      this.handler(request, state, this.emit.bind(this, response), this.end.bind(this, response));
    } else {
      response.writeHead(406, "Not Acceptable", {});
      response.end();
    }
  }
  emit(response, event, data) {

    if (typeof event !== "string" || event.indexOf("\n") !== -1)
      throw new Error("type must be a single-line string");

    if (typeof data !== "string" || data.indexOf("\n") !== -1)
      throw new Error("data must be a single-line string");

    response.write("event: " + type + "\n", "utf8");
    response.write("data: " + data + "\n\n", "utf8");
  }
  end(response) {
    response.end();
  }
}
exports.ServerSentEvents = ServerSentEvents;
