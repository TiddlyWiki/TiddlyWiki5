/*\
title: $:/plugins/tiddlywiki/multiwikiserver/router.js
type: application/javascript
module-type: library

Serve tiddlers over http

\*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Router = void 0;
const assert_1 = require("assert");
const zlib_1 = require("zlib");
const crypto_1 = require("crypto");
const sql_tiddler_store_1 = require("./store/sql-tiddler-store");
const server_1 = require("./server");
const acl = require("$:/plugins/tiddlywiki/multiwikiserver/routes/helpers/acl-middleware.js");
const FinishedResponse = Symbol("FinishedResponse");
class Router {
    constructor(options) {
        var _a;
        this.routes = [];
        this.methodMappings = {
            "GET": "readers",
            "OPTIONS": "readers",
            "HEAD": "readers",
            "PUT": "writers",
            "POST": "writers",
            "DELETE": "writers"
        };
        this.methodACLPermMappings = {
            "GET": "READ",
            "OPTIONS": "READ",
            "HEAD": "READ",
            "PUT": "WRITE",
            "POST": "WRITE",
            "DELETE": "WRITE"
        };
        this.store = options.store;
        this.wiki = options.wiki;
        // delete falsy keys so that we can use the default values
        for (const key in options.variables) {
            if (!options.variables[key]) {
                delete options.variables[key];
            }
        }
        // Initialise the variables (Object.assign scoops peroperties up from left to right)
        this.variables = Object.assign({}, server_1.defaultVariables, (_a = options.variables) !== null && _a !== void 0 ? _a : {});
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
        }
        else if (this.get("credentials")) {
            authorizedUserName = "(authenticated)";
        }
        else {
            authorizedUserName = "(anon)";
        }
        this.authorizations = {
            readers: (this.get("readers") || authorizedUserName).split(",").map($tw.utils.trim),
            writers: (this.get("writers") || authorizedUserName).split(",").map($tw.utils.trim),
            /** @type {string[] | undefined} */
            admin: undefined
        };
        if (this.get("admin") || authorizedUserName !== "(anon)") {
            this.authorizations["admin"] = (this.get("admin") || authorizedUserName).split(',').map($tw.utils.trim);
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
    get(key) {
        return this.variables[key];
    }
    addRoute(route, title) {
        if (!route)
            throw new Error(`Route ${title} is not defined`);
        if (this.methodMappings[route.method] === undefined) {
            throw new Error(`Route ${title} does not have a valid method, expected one of ${Object.keys(this.methodMappings).join(", ")}`);
        }
        if (!route.path) {
            throw new Error(`Route ${title} does not have a path`);
        }
        if (route.useACL) {
            const permissionName = this.methodACLPermMappings[route.method];
            if (!route.entityName) {
                throw new Error(`Route ${title} is configured to use ACL middleware but does not specify an entityName`);
            }
            if (!permissionName) {
                throw new Error(`Route ${title} is configured to use ACL middleware but the route method does not support ACL`);
            }
        }
        this.routes.push(route);
    }
    addAuthenticator(AuthenticatorClass, title) {
    }
    serverManagerRequestHandler(server, request, response) {
        this.routeRequest(server, request, response).catch(console.error);
    }
    async routeRequest(server, request, response, options) {
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
            (0, assert_1.ok)(route.entityName);
            const permissionName = this.methodACLPermMappings[route.method];
            await acl.middleware(request, response, state, route.entityName, permissionName);
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
            && !response.headersSent) {
            if (!response.headersSent)
                response.writeHead(403, "'X-Requested-With' header required to login");
            return state.end();
        }
        // if we've sent headers already, it was a denied request
        if (response.headersSent)
            return state.end();
        // Receive the request body if necessary and hand off to the route handler
        if (route.bodyFormat === "stream" || request.method === "GET" || request.method === "HEAD") {
            // Let the route handle the request stream itself
            await route.handler(request, response, state);
            return state.end();
        }
        else if (route.bodyFormat === "string"
            || route.bodyFormat === "www-form-urlencoded"
            || !route.bodyFormat) {
            // Set the encoding for the incoming request
            request.setEncoding("utf8");
            await this.readBodyString(request, route, state);
            await route.handler(request, response, state);
            return state.end();
        }
        else if (route.bodyFormat === "buffer") {
            await this.readBodyBuffer(request, state);
            await route.handler(request, response, state);
            return state.end();
        }
        else {
            $tw.utils.warning(`Invalid bodyFormat ${route.bodyFormat} in route ${route.method} ${route.path.source}`);
            response.writeHead(500);
            return state.end();
        }
    }
    findMatchingRoute(request, state) {
        for (var t = 0; t < this.routes.length; t++) {
            var potentialRoute = this.routes[t], pathRegExp = potentialRoute.path, pathname = state.urlInfo.pathname, match;
            if (state.pathPrefix) {
                if (pathname.substr(0, state.pathPrefix.length) === state.pathPrefix) {
                    pathname = pathname.substr(state.pathPrefix.length) || "/";
                    match = pathRegExp.exec(pathname);
                }
                else {
                    match = null;
                }
            }
            else {
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
    }
    ;
    async readBodyString(request, route, state) {
        await (new Promise((resolve) => {
            let data = "";
            request.on("data", function (chunk) {
                data += chunk.toString();
            });
            request.on("end", function () {
                if (route.bodyFormat === "www-form-urlencoded") {
                    state.data = new URLSearchParams(data);
                }
                else {
                    state.data = data;
                }
                resolve();
            });
        }));
    }
    async readBodyBuffer(request, state) {
        await (new Promise((resolve) => {
            const data = [];
            request.on("data", function (chunk) {
                data.push(chunk);
            });
            request.on("end", function () {
                state.data = Buffer.concat(data);
                resolve();
            });
        }));
    }
    async authenticateUser(request, response) {
        var _a;
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
        return Object.assign(Object.assign({}, user), { isAdmin: ((_a = userRole === null || userRole === void 0 ? void 0 : userRole.role_name) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === 'admin', sessionId: session_id, password: undefined });
    }
    ;
    isAuthorized(authorizationType, username) {
        var principals = this.authorizations[authorizationType] || [];
        return principals.indexOf("(anon)") !== -1
            || (username && (principals.indexOf("(authenticated)") !== -1
                || principals.indexOf(username) !== -1));
    }
    requestAuthentication(response) {
        if (!response.headersSent) {
            response.writeHead(401, {
                'WWW-Authenticate': 'Basic realm="Secure Area"'
            });
            response.end('Authentication required.');
        }
    }
    ;
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
    parseCookieString(cookieString) {
        const cookies = {};
        if (typeof cookieString !== 'string')
            return cookies;
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
    async makeRequestState(server, request, response, options = {}) {
        // Authenticate the user
        const authenticatedUser = await this.authenticateUser(request, response);
        const authenticatedUsername = authenticatedUser === null || authenticatedUser === void 0 ? void 0 : authenticatedUser.username;
        // Get the principals authorized to access this resource
        const authorizationType = options.authorizationType
            || this.methodMappings[request.method]
            || "readers";
        var { allowReads, allowWrites, isEnabled, showAnonConfig } = this.getAnonymousAccessConfig();
        const urlInfo = new URL(request.url, server.origin());
        return {
            authorizationType,
            pathPrefix: options.pathPrefix || server.pathPrefix || "",
            store: new sql_tiddler_store_1.SqlTiddlerStore({
                attachmentStore: this.store.attachmentStore,
                adminWiki: this.store.adminWiki,
                databasePath: this.store.databasePath
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
            showAnonConfig: !!(authenticatedUser === null || authenticatedUser === void 0 ? void 0 : authenticatedUser.isAdmin) && showAnonConfig,
            firstGuestUser: !authenticatedUser && (await this.store.sql.listUsers()).length === 0,
            data: undefined,
            params: [],
            end: () => {
                this.store.sql.close();
                response.end();
                return { [FinishedResponse]: true };
            }
        };
    }
    sendResponse(request, response, statusCode, headers, data, encoding) {
        if (typeof data === "string" && encoding === undefined) {
            $tw.utils.error("Missing encoding for string data, we assume utf8");
            encoding = "utf8";
        }
        if (this.enableBrowserCache && (statusCode == 200)) {
            var hash = (0, crypto_1.createHash)('md5');
            // Put everything into the hash that could change and invalidate the data that
            // the browser already stored. The headers the data and the encoding.
            if (data !== undefined)
                hash.update(data);
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
                var matchParts = ifNoneMatch.split(",").map(function (/** @type {string} */ etag) {
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
                data = (0, zlib_1.deflateSync)(data);
            }
            else if (/\bgzip\b/.test(acceptEncoding)) {
                headers["Content-Encoding"] = "gzip";
                data = (0, zlib_1.gzipSync)(data);
            }
        }
        if (!response.headersSent) {
            response.writeHead(statusCode, headers);
            if (typeof data === "string")
                response.end(data, encoding !== null && encoding !== void 0 ? encoding : "utf8");
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
    redirect(request, response, statusCode, location) {
        response.setHeader("Location", location);
        response.statusCode = statusCode;
        response.end();
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
    streamMultipartData(request, options) {
        // Check that the Content-Type is multipart/form-data
        const contentType = request.headers['content-type'];
        if (!(contentType === null || contentType === void 0 ? void 0 : contentType.startsWith("multipart/form-data"))) {
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
                    const currentHeaders = {};
                    headersPart.split("\r\n").forEach(headerLine => {
                        const [key, value] = headerLine.split(": ");
                        currentHeaders[key.toLowerCase()] = value;
                    });
                    // Parse the content disposition header
                    const contentDisposition = {
                        name: null,
                        filename: null
                    };
                    if (currentHeaders["content-disposition"]) {
                        // Split the content-disposition header into semicolon-delimited parts
                        const parts = currentHeaders["content-disposition"].split(";").map(part => part.trim());
                        // Iterate over each part to extract name and filename if they exist
                        parts.forEach(part => {
                            if (part.startsWith("name=")) {
                                // Remove "name=" and trim quotes
                                contentDisposition.name = part.substring(6, part.length - 1);
                            }
                            else if (part.startsWith("filename=")) {
                                // Remove "filename=" and trim quotes
                                contentDisposition.filename = part.substring(10, part.length - 1);
                            }
                        });
                    }
                    processingPart = true;
                    options.cbPartStart(currentHeaders, contentDisposition.name, contentDisposition.filename);
                    // Slice the buffer to the next part
                    buffer = Buffer.from(buffer.slice(endOfHeaders + 4));
                }
                else {
                    const boundaryIndex = buffer.indexOf(boundaryBuffer);
                    if (boundaryIndex >= 0) {
                        // Return the part up to the boundary minus the terminating LF CR
                        options.cbPartChunk(Buffer.from(buffer.slice(0, boundaryIndex - 2)));
                        options.cbPartEnd();
                        processingPart = false;
                        buffer = Buffer.from(buffer.slice(boundaryIndex));
                    }
                    else {
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
    makeTiddlerEtag(options) {
        if (options.bag_name || options.tiddler_id) {
            return "\"tiddler:" + options.bag_name + "/" + options.tiddler_id + "\"";
        }
        else {
            throw "Missing bag_name or tiddler_id";
        }
    }
}
exports.Router = Router;
//# sourceMappingURL=router.js.map