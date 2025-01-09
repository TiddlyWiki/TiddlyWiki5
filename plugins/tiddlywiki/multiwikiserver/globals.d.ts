import { SqlTiddlerDatabase } from "./modules/store/sql-tiddler-database";
import { IncomingMessage as HTTPIncomingMessage } from "http";
declare global {
  const $tw: {
    loadTiddlersFromPath: any;
    loadPluginFolder: any;
    getLibraryItemSearchPaths: any;
    wiki: $TW.Wiki;
    utils: any;
    boot: any;
    config: any;
    node: any;
    modules: any;
    hooks: any;
    sjcl: any;
    Wiki: { new(): $TW.Wiki };
    Tiddler: { new(fields: Record<string, any>): $TW.Tiddler };
    mws: {
      serverManager: ServerManager;
      store: SqlTiddlerStore
    }
  }

  namespace $TW {
    interface Wiki extends Record<string, any> {

    }
    interface Boot {

    }
    interface Tiddler {

    }
  }
  type SqlTiddlerDatabase = import("./modules/store/sql-tiddler-database").SqlTiddlerDatabase;
  type SqlTiddlerStore = import("./modules/store/sql-tiddler-store").SqlTiddlerStore;
  type Server = import("./modules/mws-server.js").Server;
  type ServerState = Awaited<ReturnType<Server["makeRequestState"]>>;
  interface IncomingMessage extends HTTPIncomingMessage {
    url: string
  };
  type ServerResponse = import("http").ServerResponse;
  interface ServerRoute {
    path: RegExp;
    handler: ServerRouteHandler;
    method?: string;
    useACL?: boolean;
    entityName?: string;
    csrfDisable?: boolean;
    bodyFormat?: string;
  }
  interface ServerOptions {
    sqlTiddlerDatabase?: SqlTiddlerDatabase;
    variables?: Server["defaultVariables"];
    authenticators?: unknown[];
    routes?: [];
    wiki?: any;
    boot?: any;
  }

  interface ServerRouteHandler {
    (this: ServerRoute, req: IncomingMessage, res: ServerResponse, state: ServerState): Promise<void>;
  }

}
class ServerManager {
  constructor();
  createServer(options: ServerOptions);
}

export { };