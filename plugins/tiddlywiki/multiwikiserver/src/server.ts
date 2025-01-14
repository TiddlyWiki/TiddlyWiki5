/*\
title: $:/plugins/tiddlywiki/multiwikiserver/server.js
type: application/javascript
module-type: library

Serve tiddlers over http

\*/
"use strict";
import { ok } from "assert";
import { readFileSync } from "fs";
import * as http from "http";
import * as https from "https";
import * as net from "net";
import { Router } from "./router";



declare global {

  interface IncomingMessage extends http.IncomingMessage {
    url: string;
    method: string;
  }
  interface ServerResponse extends http.ServerResponse { }
}


export interface ServerVariables {

  port: string
  host: string
  "required-plugins": string
  "root-tiddler": string
  "root-render-type": string
  "root-serve-type": string
  "tiddler-render-type": string
  "tiddler-render-template": string
  "system-tiddler-render-type": string
  "system-tiddler-render-template": string
  "use-browser-cache"?: "yes"
  "debug-level": "none"
  "gzip"?: "yes"
  "csrf-disable"?: "yes"
  "path-prefix"?: string
  /** TLS Private Key file path */
  "tls-key-file"?: string
  /** TLS Public Cert file path */
  "tls-cert-file"?: string
  /** TLS Private Key passphrase */
  "tls-passphrase"?: string
  /** Server name, mostly for 403 errors */
  "server-name"?: string
  /** the expected origin header */
  "origin"?: string
  /** a single username */
  username?: string
  /** a single password */
  password?: string
  /**  */
  credentials?: string
  /** comma-delimited list of reader usernames */
  readers?: string
  /** comma-delimited list of writer usernames */
  writers?: string
  /** comma-delimited list of admin usernames */
  admin?: string
}


export const defaultVariables = {
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
} as const;


interface ServerDefinition {
  address: string,
  port: number,
  path: string,
  /** Path to the key file on the file system */
  tlsKeyFile?: string;
  /** Path to the cert file on the file system */
  tlsCertFile?: string;
  tlsPass?: string;
}


export class ServerManager {
  servers: Map<ServerDefinition, Server> = new Map();
  constructor() {
    // Stop listening when we get the "th-quit" hook
    $tw.hooks.addHook("th-quit", () => {
      this.isClosing = true;
      this.servers.forEach(server => server.close());
    });
  }

  isClosing = false;

  onListen = (server: Server) => {
    // Log listening details
    $tw.utils.log("Serving on " + server.origin(), "brown/orange");
  };
  onError = (server: Server, err: Error) => {
    $tw.utils.warning(`Error serving on ${server.origin()}: ${err.message}`);
  };
  onClose = (server: Server) => {
    if (this.isClosing) {
      $tw.utils.log(`Server closed: ${server.origin()}`, "green");
    } else {
      $tw.utils.warning("Server closed unexpectedly: " + server.origin(), "red");
      server.listen(); // Attempt to restart the listener
    }
  };
  onRequest = (server: Server, request: IncomingMessage, response: ServerResponse) => {
    $tw.utils.warning(new Error("The mws-listen command has not been run yet."));
    response.writeHead(500).end("Server is not started yet.");
  };
  /** require and create the router, attaching it to the server manager */
  createRouter(params: ServerVariables) {
    $tw.mws.router = new Router({ wiki: $tw.wiki, variables: params, store: $tw.mws.store });
    this.onRequest = $tw.mws.router.serverManagerRequestHandler.bind($tw.mws.router);
  }
  createServer(options: ServerDefinition, listening?: () => void) {
    const server2 = this.mapServer(options, listening);
    this.servers.set(options, server2);
    server2.listen();
    return server2;
  }
  listenCommand(params: Partial<ServerVariables>, listening?: () => void) {
    // Handle defaults for port and host
    return this.createServer({
      address: params.host || defaultVariables.host,
      port: +(params.port ?? "") || +(process.env.PORT ?? "") || +defaultVariables.port,
      path: params["path-prefix"] || "",
      tlsKeyFile: params["tls-key-file"],
      tlsCertFile: params["tls-cert-file"],
      tlsPass: params["tls-passphrase"],
    }, listening)
  }

  private mapServer(server: ServerDefinition, listening?: () => void) {
    const { address, port, path, tlsKeyFile, tlsCertFile, tlsPass } = server;

    if (tlsKeyFile || tlsCertFile || tlsPass) {
      if ((!tlsKeyFile || !tlsCertFile)) {
        throw new Error("TLS Key and Cert must be provided together, TLS Passphrase is optional, "
          + "but if it is provided then TLS Key and Cert are also required.");
      }
      const server2 = new Server(
        https.createServer({
          key: readFileSync(tlsKeyFile),
          cert: readFileSync(tlsCertFile),
          passphrase: tlsPass,
        }),
        "https", address, port, path,
        () => { this.onListen(server2); listening?.(); },
        this.onError,
        this.onClose,
        this.onRequest,
      );
      return server2;
    } else {
      const server2 = new Server(
        http.createServer(),
        "http", address, port, path,
        () => { this.onListen(server2); listening?.(); },
        this.onError,
        this.onClose,
        this.onRequest,
      );
      return server2;
    }
  }
}

export class Server<S extends net.Server = any> {
  constructor(
    public readonly server: S,
    public readonly protocol: "http" | "https",
    public readonly host: string,
    public readonly port: number,
    public readonly pathPrefix: string,
    onListen: (server: Server) => void,
    onError: (server: Server, err: Error) => void,
    onClose: (server: Server) => void,
    onRequest: (server: Server, req: IncomingMessage, res: ServerResponse) => void,
  ) {
    ok(this.protocol === "http" || this.protocol === "https",
      "Expected protocol to be http or https");
    ok(typeof this.host === "string",
      "Expected host to be a string");
    ok(typeof this.port === "number" && this.port > 0,
      "Expected port to be defined");
    ok(!this.pathPrefix || this.pathPrefix.startsWith("/") && !this.pathPrefix.endsWith("/"),
      "Expected pathPrefix to start with a / but NOT end with one");

    this.server.on("listening", onListen.bind(null, this));
    this.server.on("error", onError.bind(null, this));
    this.server.on("close", onClose.bind(null, this));
    this.server.on("request", onRequest.bind(null, this));
  }
  address() {
    const address = this.server.address();
    if (!address) { return null; }
    if (typeof address === "string") {
      throw new Error("Expected server.address() to return an object");
    }
    return {
      protocol: this.protocol,
      family: address.family,
      address: address.address,
      port: address.port,
    }
  }
  origin() {
    const address = this.address();
    if (!address) { return null; }
    const host = address.family === "IPv6" ? "[" + address.address + "]" : address.address
    return `${address.protocol}://${host}:${address.port}`;
  }
  listen(): void {
    this.server.listen(this.port, this.host);
  }
  close() {
    this.server.close();
  }
}
