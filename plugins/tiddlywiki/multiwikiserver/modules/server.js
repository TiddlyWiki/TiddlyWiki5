/*\
title: $:/plugins/tiddlywiki/multiwikiserver/server.js
type: application/javascript
module-type: library

Serve tiddlers over http

\*/
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = exports.ServerManager = exports.defaultVariables = void 0;
const assert_1 = require("assert");
const fs_1 = require("fs");
const http = require("http");
const https = require("https");
const router_1 = require("./router");
exports.defaultVariables = {
    port: "8080",
    host: "127.0.0.1",
    "required-plugins": "$:/plugins/tiddlywiki/filesystem,$:/plugins/tiddlywiki/tiddlyweb",
    "root-tiddler": "$:/core/save/all",
    "root-render-type": "text/plain",
    "root-serve-type": "text/html",
    "tiddler-render-type": "text/html",
    "tiddler-render-template": "$:/core/templates/server/static.tiddler.html",
    "system-tiddler-render-type": "text/plain",
    "system-tiddler-render-template": "$:/core/templates/wikified-tiddler",
    "debug-level": "none",
};
class ServerManager {
    constructor() {
        this.servers = new Map();
        this.isClosing = false;
        this.onListen = (server) => {
            // Log listening details
            $tw.utils.log("Serving on " + server.origin(), "brown/orange");
        };
        this.onError = (server, err) => {
            $tw.utils.warning(`Error serving on ${server.origin()}: ${err.message}`);
        };
        this.onClose = (server) => {
            if (this.isClosing) {
                $tw.utils.log(`Server closed: ${server.origin()}`, "green");
            }
            else {
                $tw.utils.warning("Server closed unexpectedly: " + server.origin(), "red");
                server.listen(); // Attempt to restart the listener
            }
        };
        this.onRequest = (server, request, response) => {
            $tw.utils.warning(new Error("The mws-listen command has not been run yet."));
            response.writeHead(500).end("Server is not started yet.");
        };
        // Stop listening when we get the "th-quit" hook
        $tw.hooks.addHook("th-quit", () => {
            this.isClosing = true;
            this.servers.forEach(server => server.close());
        });
    }
    /** require and create the router, attaching it to the server manager */
    createRouter(params) {
        $tw.mws.router = new router_1.Router({ wiki: $tw.wiki, variables: params, store: $tw.mws.store });
        this.onRequest = $tw.mws.router.serverManagerRequestHandler.bind($tw.mws.router);
    }
    createServer(options, listening) {
        const server2 = this.mapServer(options, listening);
        this.servers.set(options, server2);
        server2.listen();
        return server2;
    }
    listenCommand(params, listening) {
        var _a, _b;
        // Handle defaults for port and host
        return this.createServer({
            address: params.host || exports.defaultVariables.host,
            port: +((_a = params.port) !== null && _a !== void 0 ? _a : "") || +((_b = process.env.PORT) !== null && _b !== void 0 ? _b : "") || +exports.defaultVariables.port,
            path: params["path-prefix"] || "",
            tlsKeyFile: params["tls-key-file"],
            tlsCertFile: params["tls-cert-file"],
            tlsPass: params["tls-passphrase"],
        }, listening);
    }
    mapServer(server, listening) {
        const { address, port, path, tlsKeyFile, tlsCertFile, tlsPass } = server;
        if (tlsKeyFile || tlsCertFile || tlsPass) {
            if ((!tlsKeyFile || !tlsCertFile)) {
                throw new Error("TLS Key and Cert must be provided together, TLS Passphrase is optional, "
                    + "but if it is provided then TLS Key and Cert are also required.");
            }
            const server2 = new Server(https.createServer({
                key: (0, fs_1.readFileSync)(tlsKeyFile),
                cert: (0, fs_1.readFileSync)(tlsCertFile),
                passphrase: tlsPass,
            }), "https", address, port, path, () => { this.onListen(server2); listening === null || listening === void 0 ? void 0 : listening(); }, this.onError, this.onClose, this.onRequest);
            return server2;
        }
        else {
            const server2 = new Server(http.createServer(), "http", address, port, path, () => { this.onListen(server2); listening === null || listening === void 0 ? void 0 : listening(); }, this.onError, this.onClose, this.onRequest);
            return server2;
        }
    }
}
exports.ServerManager = ServerManager;
class Server {
    constructor(server, protocol, host, port, pathPrefix, onListen, onError, onClose, onRequest) {
        this.server = server;
        this.protocol = protocol;
        this.host = host;
        this.port = port;
        this.pathPrefix = pathPrefix;
        (0, assert_1.ok)(this.protocol === "http" || this.protocol === "https", "Expected protocol to be http or https");
        (0, assert_1.ok)(typeof this.host === "string", "Expected host to be a string");
        (0, assert_1.ok)(typeof this.port === "number" && this.port > 0, "Expected port to be defined");
        (0, assert_1.ok)(!this.pathPrefix || this.pathPrefix.startsWith("/") && !this.pathPrefix.endsWith("/"), "Expected pathPrefix to start with a / but NOT end with one");
        this.server.on("listening", onListen.bind(null, this));
        this.server.on("error", onError.bind(null, this));
        this.server.on("close", onClose.bind(null, this));
        this.server.on("request", onRequest.bind(null, this));
    }
    address() {
        const address = this.server.address();
        if (!address) {
            return null;
        }
        if (typeof address === "string") {
            throw new Error("Expected server.address() to return an object");
        }
        return {
            protocol: this.protocol,
            family: address.family,
            address: address.address,
            port: address.port,
        };
    }
    origin() {
        const address = this.address();
        if (!address) {
            return null;
        }
        const host = address.family === "IPv6" ? "[" + address.address + "]" : address.address;
        return `${address.protocol}://${host}:${address.port}`;
    }
    listen() {
        this.server.listen(this.port, this.host);
    }
    close() {
        this.server.close();
    }
}
exports.Server = Server;
//# sourceMappingURL=server.js.map