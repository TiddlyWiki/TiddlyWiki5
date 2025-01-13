import { IncomingMessage as HTTPIncomingMessage, ServerResponse as HTTPServerResponse } from "http";
import { Server as _Server } from "./src/server";
import { Router } from "./src/router";
import { SqlTiddlerStore as _SqlTiddlerStore } from "./modules/store/sql-tiddler-store";
import { SqlTiddlerDatabase as _SqlTiddlerDatabase } from "./modules/store/sql-tiddler-database";
import { Authenticator as _Authenticator } from "./auth/authentication";
import { Prisma, PrismaClient } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/library";
import "./src/startup";

declare global {
  const $tw: $TW;

  namespace $TW {
    interface Wiki extends Record<string, any> {

    }
    interface Boot {

    }
    interface Tiddler {

    }
  }

  interface $TW {
    loadTiddlersFromPath: any;
    loadPluginFolder: any;
    getLibraryItemSearchPaths: any;
    wiki: $TW.Wiki;
    utils: {
      [x: string]: any;
      decodeURIComponentSafe(str: string): string;
      each<T>(object: T[], callback: (value: T, index: number, object: T[]) => void): void;
      each<T>(object: Record<string, T>, callback: (value: T, key: string, object: Record<string, T>) => void): void;
      parseJSONSafe(str: string, defaultJSON?: any): any;
    };
    modules: {
      [x: string]: any;
      forEachModuleOfType: (moduleType: string, callback: (title: string, module: any) => void) => void;
    }
    boot: any;
    config: any;
    node: any;
    hooks: any;
    sjcl: any;
    Wiki: { new(): $TW.Wiki };
    Tiddler: { new(fields: Record<string, any>): $TW.Tiddler };

  }

  type Server = _Server;
  type SqlTiddlerStore = _SqlTiddlerStore;
  type SqlTiddlerDatabase = _SqlTiddlerDatabase;
  type Authenticator = _Authenticator;

  type HTTPVerb = "GET" | "OPTIONS" | "HEAD" | "PUT" | "POST" | "DELETE";

  interface IncomingMessage extends HTTPIncomingMessage {
    url: string;
    method: string;
    headers: {
      "set-cookie"?: string[];
      [x: string]: string | undefined;
    }
  }

  interface ServerResponse extends HTTPServerResponse { }

  type InnerState = Awaited<ReturnType<Router["makeRequestState"]>>;
  interface ServerState<P extends number, F extends ServerRouteBodyFormat> extends InnerState {
    params: string[] & { length: P };
    data:
    F extends "json" ? any :
    F extends "www-form-urlencoded" ? URLSearchParams :
    F extends "buffer" ? Buffer :
    F extends "stream" ? undefined :
    string;
  }

  type PrismaTxnClient = Omit<PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">
  interface ServerRoute {
    path: RegExp;
    handler: ServerRouteHandler<number>;
    method?: string;
    useACL?: boolean;
    /** this is required if useACL is true */
    entityName?: string;
    csrfDisable?: boolean;
    bodyFormat?: ServerRouteBodyFormat;
  }
  type ServerRouteBodyFormat = "string" | "www-form-urlencoded" | "buffer" | "stream";
  interface ServerRouteHandler<P extends number, F extends ServerRouteBodyFormat = "string"> {
    (this: ServerRoute, req: IncomingMessage, res: ServerResponse, state: ServerState<P, F>): Promise<void>;
  }

}


export { };


