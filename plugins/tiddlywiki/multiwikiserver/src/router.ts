/*\
title: $:/plugins/tiddlywiki/multiwikiserver/router.js
type: application/javascript
module-type: library

Serve tiddlers over http

\*/
"use strict";
import { parse as parseQueryString } from "querystring";

import { ok } from "assert";
import { deflateSync, gzipSync } from "zlib";
import { createHash } from "crypto";
import { SqlTiddlerStore } from "./store/sql-tiddler-store";
import { defaultVariables, Server, ServerVariables } from "./server";

const acl: {
  middleware: (
    request: IncomingMessage,
    response: ServerResponse,
    state: ServerState<any, any>,
    entityType: string,
    permissionName: string
  ) => Promise<void>;
} = require("$:/plugins/tiddlywiki/multiwikiserver/routes/helpers/acl-middleware.js");

const FinishedResponse: unique symbol = Symbol("FinishedResponse");
type FinishedResponse = { [FinishedResponse]: boolean }

type RequestState = Awaited<ReturnType<Router["makeRequestState"]>>;

export class Router {
  variables: ServerVariables;
  requiredPlugins: string[];
  csrfDisable: boolean;
  enableGzip: boolean;
  enableBrowserCache: boolean;
  store: SqlTiddlerStore<any>;
  wiki: Wiki;
  authorizations: {
    readers: string[];
    writers: string[];
    admin: string[] | undefined;
  };
  routes: ServerRoute[] = [];
  authenticators: any[] = [];
  constructor(options: {
    variables: Partial<ServerVariables>
    wiki: any,
    store: SqlTiddlerStore<any>
  }) {
    this.store = options.store;
    this.wiki = options.wiki;

    // delete falsy keys so that we can use the default values
    for (const key in options.variables) {
      if (!(options.variables as any)[key]) {
        delete (options.variables as any)[key];
      }
    }
    // Initialise the variables (Object.assign scoops peroperties up from left to right)
    this.variables = Object.assign({}, defaultVariables, options.variables ?? {});
    // Setup the default required plugins
    this.requiredPlugins = this.get("required-plugins").split(',');
    // Initialise CSRF
    this.csrfDisable = this.get("csrf-disable") === "yes";
    // Initialize Gzip compression
    this.enableGzip = this.get("gzip") === "yes";
    // Initialize browser-caching
    this.enableBrowserCache = this.get("use-browser-cache") === "yes";

    // Warn if required plugins are missing
    const missing = this.requiredPlugins.filter(title => {
      return !$tw.wiki.getTiddler(title);
    });

    if (missing.length > 0) {
      const error = "Warning: Plugin(s) required for client-server operation are missing.\n" +
        "\"" + missing.join("\", \"") + "\"";
      $tw.utils.warning(error);
    }

    // Initialise authorization
    let authorizedUserName;
    if (this.get("username") && this.get("password")) {
      authorizedUserName = this.get("username") || ""; //redundant for type checker
    } else if (this.get("credentials")) {
      authorizedUserName = "(authenticated)";
    } else {
      authorizedUserName = "(anon)";
    }
    this.authorizations = {
      readers: (this.get("readers") || authorizedUserName).split(",").map($tw.utils.trim),
      writers: (this.get("writers") || authorizedUserName).split(",").map($tw.utils.trim),
      /** @type {string[] | undefined} */
      admin: undefined
    }
    if (this.get("admin") || authorizedUserName !== "(anon)") {
      this.authorizations["admin"] = (this.get("admin") || authorizedUserName).split(',').map($tw.utils.trim)
    }
    // Load and initialise authenticators
    $tw.modules.forEachModuleOfType("authenticator", (title, authenticatorDefinition) => {
      this.addAuthenticator(authenticatorDefinition.AuthenticatorClass, title);
    });
    // Load route handlers
    $tw.modules.forEachModuleOfType("mws-route", (title, routeDefinition) => {
      this.addRoute(routeDefinition, title);
    });

  }

  get<K extends keyof ServerVariables>(key: K) {
    return this.variables[key];
  }

  addRoute(route: any, title: string) {
    if (!route) throw new Error(`Route ${title} is not defined`);

    if (this.methodMappings[route.method as keyof Router["methodMappings"]] === undefined) {
      throw new Error(`Route ${title} does not have a valid method, expected one of ${Object.keys(this.methodMappings).join(", ")}`);
    }

    if (!route.path) {
      throw new Error(`Route ${title} does not have a path`);
    }

    if (route.useACL) {

      const permissionName = this.methodACLPermMappings[route.method as keyof Router["methodACLPermMappings"]];

      if (!route.entityName) {
        throw new Error(`Route ${title} is configured to use ACL middleware but does not specify an entityName`);
      }

      if (!permissionName) {
        throw new Error(`Route ${title} is configured to use ACL middleware but the route method does not support ACL`);
      }

    }

    this.routes.push(route);

  }

  addAuthenticator(AuthenticatorClass: any, title: string) {
    // Instantiate and initialise the authenticator
    var authenticator = new AuthenticatorClass(this),
      result = authenticator.init();
    if (typeof result === "string") {
      $tw.utils.error("Error: " + result);
    } else if (result) {
      // Only use the authenticator if it initialised successfully
      this.authenticators.push(authenticator);
    }
  }

  serverManagerRequestHandler(
    server: Server,
    request: IncomingMessage,
    response: ServerResponse
  ) {

    // $tw.mws.connection.$transaction(async (prisma) => {
    // the database transaction gets committed when the promise resolves
    // and rolled back if it rejects
    this.routeRequest(server, request, response).catch(console.error);
    // },{maxWait: 30000, timeout: 20000}).catch(console.error);

  }

  async routeRequest(
    server: Server,
    request: IncomingMessage,
    response: ServerResponse,
    options?: any,
  ): Promise<FinishedResponse> {
    // returning the response object in order to make sure we call response.end() because the route 
    // handler should never resolve the promise until it finishes writing the response. 
    // After that, the database connection gets closed or returned to the pool.
    // An error should be thrown if the connection has unfinished business when end is called,
    // because that probably means we forgot to await something. 

    if (this.get("debug-level") !== "none") {
      var start = $tw.utils.timer();
      response.on("finish", function () {
        console.log("Response time:", request.method, request.url, $tw.utils.timer() - start);
      });
    }

    // Compose the state object
    const state = await this.makeRequestState(server, request, response, options);

    // Authorize with the authenticated username
    if (!this.isAuthorized(state.authorizationType, state.authenticatedUsername)) {
      if (!response.headersSent)
        response.writeHead(403, "'" + state.authenticatedUsername + "' is not authorized");
      return state.end();
    }

    // Find the route that matches this path
    var route = this.findMatchingRoute(request, state);

    // Return a 404 if we didn't find a route
    if (!route) {
      if (!response.headersSent)
        response.writeHead(404);
      return state.end();
    }

    // If the route is configured to use ACL middleware, check that the user has permission
    if (route.useACL) {
      ok(route.entityName);
      const permissionName = this.methodACLPermMappings[route.method as keyof Router["methodACLPermMappings"]];
      await acl.middleware(request, response, state, route.entityName, permissionName)
    }

    // Optionally output debug info
    if (this.get("debug-level") !== "none") {
      console.log("Request path:", JSON.stringify(state.urlInfo));
      console.log("Request headers:", JSON.stringify(request.headers));
      console.log("authenticatedUsername:", state.authenticatedUsername);
    }

    // If this is a write, check for the CSRF header unless globally disabled, or disabled for this route
    if (!this.csrfDisable
      && !route.csrfDisable
      && state.authorizationType === "writers"
      && request.headers["x-requested-with"] !== "TiddlyWiki"
      && !response.headersSent
    ) {
      if (!response.headersSent)
        response.writeHead(403, "'X-Requested-With' header required to login");
      return state.end();
    }
    // if we've sent headers already, it was a denied request
    if (response.headersSent) return state.end();
    // Receive the request body if necessary and hand off to the route handler
    if (route.bodyFormat === "stream" || request.method === "GET" || request.method === "HEAD") {
      // Let the route handle the request stream itself
      await route.handler(request, response, state);
      return state.end();
    } else if (route.bodyFormat === "string"
      || route.bodyFormat === "www-form-urlencoded"
      || !route.bodyFormat) {
      // Set the encoding for the incoming request
      request.setEncoding("utf8");
      await this.readBodyString(request, route, state);
      await route.handler(request, response, state);
      return state.end();
    } else if (route.bodyFormat === "buffer") {
      await this.readBodyBuffer(request, state);
      await route.handler(request, response, state);
      return state.end();
    } else {
      $tw.utils.warning(`Invalid bodyFormat ${route.bodyFormat} in route ${route.method} ${route.path.source}`);
      response.writeHead(500);
      return state.end();
    }

  }

  findMatchingRoute(request: IncomingMessage, state: RequestState) {
    for (var t = 0; t < this.routes.length; t++) {
      var potentialRoute = this.routes[t],
        pathRegExp = potentialRoute.path,
        pathname = state.urlInfo.pathname,
        match;
      if (state.pathPrefix) {
        if (pathname.substr(0, state.pathPrefix.length) === state.pathPrefix) {
          pathname = pathname.substr(state.pathPrefix.length) || "/";
          match = pathRegExp.exec(pathname);
        } else {
          match = null;
        }
      } else {
        match = pathRegExp.exec(pathname);
      }
      // Allow POST as a synonym for PUT because HTML doesn't allow PUT forms
      if (match && (request.method === potentialRoute.method || (request.method === "POST" && potentialRoute.method === "PUT"))) {
        for (var p = 1; p < match.length; p++) {
          state.params.push(match[p]);
        }
        return potentialRoute;
      }
    }
    return null;
  };

  private async readBodyString(request: IncomingMessage, route: ServerRoute, state: RequestState) {
    await (new Promise<void>((resolve) => {
      let data = "";
      request.on("data", function (chunk) {
        data += chunk.toString();
      });
      request.on("end", function () {
        if (route.bodyFormat === "www-form-urlencoded") {
          state.data = new URLSearchParams(data);
        } else {
          state.data = data;
        }
        resolve();
      });
    }));
  }

  private async readBodyBuffer(request: IncomingMessage, state: RequestState) {
    await (new Promise<void>((resolve) => {
      const data: Buffer[] = [];
      request.on("data", function (chunk) {
        data.push(chunk);
      });
      request.on("end", function () {
        state.data = Buffer.concat(data);
        resolve();
      });
    }));
  }

  async authenticateUser(request: IncomingMessage, response: ServerResponse) {
    const { session: session_id } = this.parseCookieString(request.headers.cookie);
    if (!session_id) {
      return null;
    }
    // get user info
    const user = await this.store.sql.findUserBySessionId(session_id);
    if (!user) {
      return null;
    }
    //@ts-expect-error because password is not optional
    delete user.password;
    const userRole = await this.store.sql.getUserRoles(user.user_id);

    return {
      ...user,
      isAdmin: userRole?.role_name?.toLowerCase() === 'admin',
      sessionId: session_id,
      password: undefined, // for typing
    };
  };

  isAuthorized(authorizationType: RequestState["authorizationType"], username: string | undefined) {
    var principals = this.authorizations[authorizationType] || [];
    return principals.indexOf("(anon)") !== -1
      || (username && (principals.indexOf("(authenticated)") !== -1
        || principals.indexOf(username) !== -1));
  }

  requestAuthentication(response: ServerResponse) {
    if (!response.headersSent) {
      response.writeHead(401, {
        'WWW-Authenticate': 'Basic realm="Secure Area"'
      });
      response.end('Authentication required.');
    }
  };

  // Check if the anonymous IO configuration is set to allow both reads and writes
  getAnonymousAccessConfig() {
    const allowReadsTiddler = this.store.adminWiki.getTiddlerText("$:/config/MultiWikiServer/AllowAnonymousReads", "undefined");
    const allowWritesTiddler = this.store.adminWiki.getTiddlerText("$:/config/MultiWikiServer/AllowAnonymousWrites", "undefined");
    const showAnonymousAccessModal = this.store.adminWiki.getTiddlerText("$:/config/MultiWikiServer/ShowAnonymousAccessModal", "undefined");

    return {
      allowReads: allowReadsTiddler === "yes",
      allowWrites: allowWritesTiddler === "yes",
      isEnabled: allowReadsTiddler !== "undefined" && allowWritesTiddler !== "undefined",
      showAnonConfig: showAnonymousAccessModal === "yes"
    };
  }

  parseCookieString(cookieString: string | null | undefined) {
    const cookies: Record<string, string> = {};
    if (typeof cookieString !== 'string') return cookies;

    cookieString.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        cookies[key] = decodeURIComponent(value);
      }
    });

    return cookies;
  }

  async makeRequestState(server: Server, request: IncomingMessage, response: ServerResponse, options: { authorizationType?: any; pathPrefix?: any; } = {}) {

    // Authenticate the user
    const authenticatedUser = await this.authenticateUser(request, response);
    const authenticatedUsername = authenticatedUser?.username;

    // Get the principals authorized to access this resource
    const authorizationType: "readers" | "writers" = options.authorizationType
      || this.methodMappings[request.method as keyof Router["methodMappings"]]
      || "readers";

    var { allowReads, allowWrites, isEnabled, showAnonConfig } = this.getAnonymousAccessConfig();

    // // this is slightly hacky, but we're sending the connection off through the various channels.
    // // I mean, we could just pass the connection to the handler, but that would be too easy.
    // const { prisma, finish } = await new Promise<{
    //   prisma: PrismaTxnClient,
    //   finish: (value: void | PromiseLike<void>) => void
    // }>((resolveInit) => {
    //   $tw.mws.connection.$transaction(async (prisma) => {
    //     await new Promise<void>((finish) => {
    //       resolveInit({ prisma, finish });
    //     });
    //   });
    // });

    const urlInfo = new URL(request.url, server.origin()!);
    return {
      authorizationType,
      pathPrefix: options.pathPrefix || server.pathPrefix || "",
      store: new SqlTiddlerStore({
        attachmentStore: this.store.attachmentStore,
        adminWiki: this.store.adminWiki,
        prisma: $tw.mws.connection,
      }),
      urlInfo,
      queryParameters: urlInfo.searchParams,
      sendResponse: this.sendResponse.bind(this, request, response),
      redirect: this.redirect.bind(this, request, response),
      streamMultipartData: this.streamMultipartData.bind(this, request),
      makeTiddlerEtag: this.makeTiddlerEtag.bind(this),
      authenticatedUser,
      authenticatedUsername,
      anonAccessConfigured: isEnabled,
      allowAnon: isEnabled && (request.method === 'GET' ? allowReads : allowWrites),
      allowAnonReads: allowReads,
      allowAnonWrites: allowWrites,
      showAnonConfig: !!authenticatedUser?.isAdmin && showAnonConfig,
      firstGuestUser: !authenticatedUser && (await this.store.sql.listUsers()).length === 0,
      data: undefined as any,
      params: [] as string[],
      end: () => {
        // if no response was sent, send a 500
        if (!response.headersSent) {
          response.writeHead(500);
          response.end("Internal server error");
          $tw.utils.error("Response not sent " + request.method + " " + request.url);
        } else {
          response.write = () => {
            throw new Error("Cannot write to response after it has been ended");
          }
          response.end();
        }
        //
        return { [FinishedResponse]: true };
      }
    };

  }
  methodMappings = {
    "GET": "readers",
    "OPTIONS": "readers",
    "HEAD": "readers",
    "PUT": "writers",
    "POST": "writers",
    "DELETE": "writers"
  };

  methodACLPermMappings = {
    "GET": "READ",
    "OPTIONS": "READ",
    "HEAD": "READ",
    "PUT": "WRITE",
    "POST": "WRITE",
    "DELETE": "WRITE"
  }


  /**
   * Send a response to the client. This method checks if the response must be sent
   * or if the client alrady has the data cached. If that's the case only a 304
   * response will be transmitted and the browser will use the cached data.
   * Only requests with status code 200 are considdered for caching.
   * request: request instance passed to the handler
   * response: response instance passed to the handler
   * statusCode: stauts code to send to the browser
   * headers: response headers (they will be augmented with an `Etag` header)
   * data: the data to send (passed to the end method of the response instance)
   * encoding: the encoding of the data to send (passed to the end method of the response instance)
   * @this {Server}
   * @param {IncomingMessage} request
   * @param {ServerResponse} response
   * @param {number} statusCode
   * @param {Record<string, string>} headers
   * @param {string | Buffer} data
   * @param {BufferEncoding} encoding
  */
  sendResponse(request: IncomingMessage, response: ServerResponse, statusCode: number, headers: Record<string, string>, data?: Buffer): void;
  sendResponse(request: IncomingMessage, response: ServerResponse, statusCode: number, headers: Record<string, string>, data: string, encoding: BufferEncoding): void;
  sendResponse(request: IncomingMessage, response: ServerResponse, statusCode: number, headers: Record<string, string>, data?: string | Buffer, encoding?: BufferEncoding) {
    if (typeof data === "string" && encoding === undefined) {
      $tw.utils.error("Missing encoding for string data, we assume utf8");
      encoding = "utf8";
    }
    if (this.enableBrowserCache && (statusCode == 200)) {
      var hash = createHash('md5');
      // Put everything into the hash that could change and invalidate the data that
      // the browser already stored. The headers the data and the encoding.
      if (data !== undefined) hash.update(data);
      hash.update(JSON.stringify(headers));
      if (encoding) {
        hash.update(encoding);
      }
      var contentDigest = hash.digest("hex");
      // RFC 7232 section 2.3 mandates for the etag to be enclosed in quotes
      headers["Etag"] = '"' + contentDigest + '"';
      headers["Cache-Control"] = "max-age=0, must-revalidate";
      // Check if any of the hashes contained within the if-none-match header
      // matches the current hash.
      // If one matches, do not send the data but tell the browser to use the
      // cached data.
      // We do not implement "*" as it makes no sense here.
      var ifNoneMatch = request.headers["if-none-match"];
      if (ifNoneMatch) {
        var matchParts = ifNoneMatch.split(",").map(function (/** @type {string} */ etag: string) {
          return etag.replace(/^[ "]+|[ "]+$/g, "");
        });
        if (matchParts.indexOf(contentDigest) != -1) {
          response.writeHead(304, headers);
          response.end();
          return;
        }
      }
    }
    /*
    If the gzip=yes is set, check if the user agent permits compression. If so,
    compress our response if the raw data is bigger than 2k. Compressing less
    data is inefficient. Note that we use the synchronous functions from zlib
    to stay in the imperative style. The current `Server` doesn't depend on
    this, and we may just as well use the async versions.
    */
    if (this.enableGzip && data && (data.length > 2048)) {
      var acceptEncoding = request.headers["accept-encoding"] || "";
      if (/\bdeflate\b/.test(acceptEncoding)) {
        headers["Content-Encoding"] = "deflate";
        data = deflateSync(data);
      } else if (/\bgzip\b/.test(acceptEncoding)) {
        headers["Content-Encoding"] = "gzip";
        data = gzipSync(data);
      }
    }
    if (!response.headersSent) {
      response.writeHead(statusCode, headers);
      if (typeof data === "string")
        response.end(data, encoding ?? "utf8");
      else
        response.end(data);
    }
  }
  /**
   * @this {Server}
   * @param {IncomingMessage} request 
   * @param {ServerResponse} response 
   * @param {number} statusCode 
   * @param {string} location 
   */
  redirect(request: IncomingMessage, response: ServerResponse, statusCode: number, location: string) {
    response.setHeader("Location", location);
    response.statusCode = statusCode;
    response.end()
  }

  /*
  Options include:
  cbPartStart(headers,name,filename) - invoked when a file starts being received
  cbPartChunk(chunk) - invoked when a chunk of a file is received
  cbPartEnd() - invoked when a file finishes being received
  cbFinished(err) - invoked when the all the form data has been processed
  */
  /**
   * 
   * @param {import("http").IncomingMessage} request 
   * @param {Object} options 
   * @param {(headers: Object, name: string | null, filename: string | null) => void} options.cbPartStart
   * @param {(chunk: Buffer) => void} options.cbPartChunk
   * @param {() => void} options.cbPartEnd
   * @param {(err: string | null) => void} options.cbFinished
   */
  streamMultipartData(request: import("http").IncomingMessage, options: { cbPartStart: (headers: object, name: string | null, filename: string | null) => void; cbPartChunk: (chunk: Buffer) => void; cbPartEnd: () => void; cbFinished: (err: string | null) => void; }) {
    // Check that the Content-Type is multipart/form-data
    const contentType = request.headers['content-type'];
    if (!contentType?.startsWith("multipart/form-data")) {
      return options.cbFinished("Expected multipart/form-data content type");
    }
    // Extract the boundary string from the Content-Type header
    const boundaryMatch = contentType.match(/boundary=(.+)$/);
    if (!boundaryMatch) {
      return options.cbFinished("Missing boundary in multipart/form-data");
    }
    const boundary = boundaryMatch[1];
    const boundaryBuffer = Buffer.from("--" + boundary);
    // Initialise
    let buffer = Buffer.alloc(0);
    let processingPart = false;
    // Process incoming chunks
    request.on("data", (chunk) => {
      // Accumulate the incoming data
      buffer = Buffer.concat([buffer, chunk]);
      // Loop through any parts within the current buffer
      while (true) {
        if (!processingPart) {
          // If we're not processing a part then we try to find a boundary marker
          const boundaryIndex = buffer.indexOf(boundaryBuffer);
          if (boundaryIndex === -1) {
            // Haven't reached the boundary marker yet, so we should wait for more data
            break;
          }
          // Look for the end of the headers
          const endOfHeaders = buffer.indexOf("\r\n\r\n", boundaryIndex + boundaryBuffer.length);
          if (endOfHeaders === -1) {
            // Haven't reached the end of the headers, so we should wait for more data
            break;
          }
          // Extract and parse headers
          const headersPart = Uint8Array.prototype.slice.call(buffer, boundaryIndex + boundaryBuffer.length, endOfHeaders).toString();
          /** @type {Record<string, string>} */
          const currentHeaders: Record<string, string> = {};
          headersPart.split("\r\n").forEach(headerLine => {
            const [key, value] = headerLine.split(": ");
            currentHeaders[key.toLowerCase()] = value;
          });
          // Parse the content disposition header
          const contentDisposition = {
            name: null as string | null,
            filename: null as string | null
          };
          if (currentHeaders["content-disposition"]) {
            // Split the content-disposition header into semicolon-delimited parts
            const parts = currentHeaders["content-disposition"].split(";").map(part => part.trim());
            // Iterate over each part to extract name and filename if they exist
            parts.forEach(part => {
              if (part.startsWith("name=")) {
                // Remove "name=" and trim quotes
                contentDisposition.name = part.substring(6, part.length - 1);
              } else if (part.startsWith("filename=")) {
                // Remove "filename=" and trim quotes
                contentDisposition.filename = part.substring(10, part.length - 1);
              }
            });
          }
          processingPart = true;
          options.cbPartStart(currentHeaders, contentDisposition.name, contentDisposition.filename);
          // Slice the buffer to the next part
          buffer = Buffer.from(buffer.slice(endOfHeaders + 4));
        } else {
          const boundaryIndex = buffer.indexOf(boundaryBuffer);
          if (boundaryIndex >= 0) {
            // Return the part up to the boundary minus the terminating LF CR
            options.cbPartChunk(Buffer.from(buffer.slice(0, boundaryIndex - 2)));
            options.cbPartEnd();
            processingPart = false;
            buffer = Buffer.from(buffer.slice(boundaryIndex));
          } else {
            // Return the rest of the buffer
            options.cbPartChunk(buffer);
            // Reset the buffer and wait for more data
            buffer = Buffer.alloc(0);
            break;
          }
        }
      }
    });
    // All done
    request.on("end", () => {
      options.cbFinished(null);
    });
  }

  /**
  Make an etag. 
  @param {Object} options
  @param {string} options.bag_name
  @param {string} options.tiddler_id
  */
  makeTiddlerEtag(options: { bag_name: string; tiddler_id: number; }) {
    if (options.bag_name || options.tiddler_id) {
      return "\"tiddler:" + options.bag_name + "/" + options.tiddler_id + "\"";
    } else {
      throw "Missing bag_name or tiddler_id";
    }
  }


}

