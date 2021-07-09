/*jslint node: true, browser: true */
/*global $tw: false */

// commands to build this file
// npm install typescript @types/node
// npx tsc --target es5 --module commonjs --strict true --noImplicitAny false --esModuleInterop false --lib es5 core\modules\server\server-sent-events.ts

import { IncomingMessage, ServerResponse } from "http";
import { UrlWithStringQuery } from "url";
export type ServerHandlerType<T extends "string" | "stream" | "buffer"> = (
    request: IncomingMessage,
    response: ServerResponse,
    state: HandlerState<T>
) => void;
export interface RouteDef<F extends "string" | "stream" | "buffer"> {
    bodyFormat: F;
    method: string;
    path: RegExp;
    handler: ServerHandlerType<F>;
}
export interface HandlerState<T extends "string" | "stream" | "buffer"> {
    url: UrlWithStringQuery;
    data: T extends "string" ? string : T extends "buffer" ? Buffer : undefined;
    params: RegExpExecArray;
}
declare const $tw: any;
export class Journal {

    constructor(private JOURNALAGE = 5 * 60 * 1000) {

    }

    connections: Record<string, SSEClient[]> = {};
    entryIDs: Record<string, number> = {};
    records: Record<string, JournalRecord[]> = {};
    responseHeaders: Record<string, string> = {};
    cleanJournal(ts: number, channel: string) {
        let maxage = ts - this.JOURNALAGE;
        while (this.records[channel][0].Timestamp < maxage) {
            this.records[channel].shift();
        }
    }

    initJournal(key: string) {
        if (!this.connections[key]) { this.connections[key] = []; }
        if (!this.records[key]) { this.records[key] = [new JournalRecord("", "", 0, Date.now())]; }
        if (!this.entryIDs[key]) { this.entryIDs[key] = 1; }
    }

    handleConnection(conn: SSEClient) {
        var channel = conn.channel;
        this.initJournal(channel);
        if (conn.request.headers["last-event-id"]) {
            let id = conn.request.headers["last-event-id"];
            let found = false;
            // find the specified event ID the client last recieved and return everything since then
            for (let i = 0; i < this.records[channel].length; i++) {
                let tag = this.records[channel][i].EventIDString;
                if (found) { conn.writeJournalRecord(this.records[channel][i]); }
                else if (tag === id) { found = true; conn.start(200, this.responseHeaders); }
            }
            // If not found return 409 Conflict since that event id is not found
            // this way the client can retry manually if needed.
            if (found == false) { conn.start(409); conn.end(); }
        } else {
            let index = this.records[channel].length - 1;
            let latest = index > -1 ? this.records[channel][index] : null;
            conn.start(200, this.responseHeaders, latest?.EventIDString);
        }
        conn.onended = this.handleConnectionEnded.bind(this, conn);
        this.connections[channel].push(conn);
    }
    handleConnectionEnded(conn: SSEClient) {
        this.connections[conn.channel].splice(this.connections[conn.channel].indexOf(conn), 1);
    }
    handler(request: IncomingMessage, response: ServerResponse, state: HandlerState<"stream">) {
        if (true/* this.isEventStreamRequest(request) */) {
            this.handleConnection(new SSEClient(request, response, state));
        } else {
            response.writeHead(406, "Not Acceptable");
            response.end();
        }
    }
    handlerExports(prefix: string, handler = this.handler.bind(this)): RouteDef<"stream"> {
        return {
            method: "GET",
            path: new RegExp("^/events/" + prefix + "/([^/]+)$"),
            bodyFormat: "stream",
            handler
        };
    }

    isEventStreamRequest(request: IncomingMessage) {
        return request.headers.accept &&
            request.headers.accept.match(/^text\/event-stream/);
    }

    emitEvent(channel: string, type: string, msg: string, filter: (conn: AnyClient<any>) => boolean = (a) => true) {
        let ts = Date.now();
        let id = this.entryIDs[channel]++;
        let data: JournalRecord = new JournalRecord(type, msg, id, ts);
        var success = new Array(this.connections[channel].length);
        this.connections[channel].forEach((conn, i) => {
            success[i] = !filter(conn) || conn.writeJournalRecord(data);
        });
        for (let i = success.length - 1; i > -1; i--) {
            if (!success[i]) {
                this.connections[channel].splice(i, 1);
            }
        }

        this.records[channel].push(data);
        this.cleanJournal(data.Timestamp, channel);
        return data;
    }
    repeater(request: IncomingMessage, response: ServerResponse, state: HandlerState<"string">) {
        const conn = { request, response, state };
        const channel = state.params[0];
        this.initJournal(channel);
        let event = state.params[1];
        let data = this.emitEvent(channel, event, state.data, this.repeaterFilter(conn));
        response.writeHead(200);
        response.write(data.EventIDString);
        response.end();
    }
    repeaterFilter = (conn: AnyClient<"string">) => (conn: AnyClient<"stream">) => true;
    repeaterExports(method: string, prefix: string, handler = this.repeater.bind(this)): RouteDef<"string"> {
        return {
            bodyFormat: "string", method, handler,
            path: new RegExp("^/events/" + prefix + "/([^/]+)/([^/]+)$")
        };
    }
}
export class JournalRecord {

    public get EventIDString() {
        return this.Timestamp.toString() + this.EntryID.toString()
    }

    constructor(
        public Type: string,
        public Data: string,
        public EntryID: number,
        public Timestamp: number
    ) { }


}

export type SSEHandlerType = (state: SSEClient) => void;

export interface AnyClient<B extends "string" | "stream" | "buffer"> {
    request: IncomingMessage;
    response: ServerResponse;
    state: HandlerState<B>;
}

export class SSEClient implements AnyClient<"stream"> {
    static get retryInterval(): number {
        return $tw.Syncer.prototype.errorRetryInterval;
    }
    get channel() {
        return this.state.params[0];
    }
    constructor(
        public request: IncomingMessage,
        public response: ServerResponse,
        public state: HandlerState<"stream">
    ) {
        response.on("error", this.onerror.bind(this));
        response.on("close", this.onclose.bind(this));
    }
    onerror(err: any) {
        console.log("response error", err.message);
        this.response.destroy();
        this.onended && this.onended();
    }
    onclose() {
        this.end();
        this.onended && this.onended();
    }
    onended?: () => void;
    start(
        statusCode: number = 200,
        headers: Record<string, string> = {},
        eventID: string = ""
    ) {
        if (this.ended()) { return false; }

        this.response.writeHead(statusCode, $tw.utils.extend({
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            'Connection': 'keep-alive',
        }, headers));

        // write the retry interval and event id immediately
        this.write("", "", eventID);

        // setTimeout(() => { this.end(); }, 10000);

        return true;
    }

    writeJournalRecord(data: JournalRecord) {
        return this.write(data.Type, data.Data, data.EventIDString);
    }

    write(event: string, data: string, eventID: string) {
        if (this.ended()) { return false; }

        if (typeof event !== "string" || event.indexOf("\n") !== -1) {
            throw new Error("Type must be a single-line string");
        }
        if (typeof data !== "string") {
            throw new Error("Data must be a string");
        }

        this.response.write(
            (event ? "event: " + event + "\n" : "") +
            (data ? data.split('\n').map(e => "data: " + e + "\n").join('') : "") +
            (eventID ? "id: " + eventID + "\n" : "") +
            ("retry: " + SSEClient.retryInterval.toString() + "\n") +
            "\n", "utf8");

        return true;
    }

    end() {
        if (this.ended()) { return false; }
        this.response.end();
        return true;
    }

    ended() {
        var res = false;
        if (typeof this.response.writableEnded === "boolean") {
            res = res || this.response.writableEnded;
        } else if (typeof this.response.finished === "boolean") {
            res = res || this.response.finished;
        }
        return res;
    }
}