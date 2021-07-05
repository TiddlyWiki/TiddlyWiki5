"use strict";
/*jslint node: true, browser: true */
/*global $tw: false */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSEClient = exports.JournalRecord = exports.Journal = void 0;
var Journal = /** @class */ (function () {
    function Journal(JOURNALAGE) {
        if (JOURNALAGE === void 0) { JOURNALAGE = 5 * 60 * 1000; }
        this.JOURNALAGE = JOURNALAGE;
        this.connections = {};
        this.entryIDs = {};
        this.records = {};
        this.emitterFilter = function (conn) { return function (conn) { return true; }; };
    }
    Journal.prototype.cleanJournal = function (ts, channel) {
        var maxage = ts - this.JOURNALAGE;
        while (this.records[channel][0].Timestamp < maxage)
            this.records[channel].shift();
    };
    Journal.prototype.initjournal = function (key) {
        if (!this.connections[key])
            this.connections[key] = [];
        if (!this.records[key])
            this.records[key] = [];
        if (!this.entryIDs[key])
            this.entryIDs[key] = 1;
    };
    Journal.prototype.handleConnection = function (conn) {
        var channel = conn.channel;
        this.initjournal(channel);
        if (conn.request.headers["last-event-id"]) {
            var id = conn.request.headers["last-event-id"];
            var found = false;
            // find the specified event ID the client last recieved and return everything since then
            for (var i = 0; i < this.records[channel].length; i++) {
                var tag = this.records[channel][i].EventIDString;
                if (found)
                    conn.writeJournalRecord(this.records[channel][i]);
                else if (tag === id) {
                    found = true;
                    conn.start();
                }
            }
            // If not found return 409 Conflict since that event id is not found
            // this way the client can retry manually if needed.
            if (found == false) {
                conn.start(409);
                conn.end();
            }
        }
        else {
            var index = this.records[channel].length - 1;
            var latest = index > -1 ? this.records[channel][index] : null;
            conn.start(200, {}, latest === null || latest === void 0 ? void 0 : latest.EventIDString);
        }
        conn.onended = this.handleConnectionEnded.bind(this, conn);
        this.connections[channel].push(conn);
    };
    Journal.prototype.handleConnectionEnded = function (conn) {
        this.connections[conn.channel].splice(this.connections[conn.channel].indexOf(conn), 1);
    };
    Journal.prototype.handler = function (request, response, state) {
        if (true /* this.isEventStreamRequest(request) */) {
            this.handleConnection(new SSEClient(request, response, state));
        }
        else {
            response.writeHead(406, "Not Acceptable");
            response.end();
        }
    };
    Journal.prototype.handlerExports = function (prefix, handler) {
        if (handler === void 0) { handler = this.handler.bind(this); }
        return {
            method: "GET",
            path: new RegExp("^/events/" + prefix + "/([^/]+)$"),
            bodyFormat: "stream",
            handler: handler
        };
    };
    Journal.prototype.isEventStreamRequest = function (request) {
        return request.headers.accept &&
            request.headers.accept.match(/^text\/event-stream/);
    };
    Journal.prototype.emitEvent = function (channel, type, msg, filter) {
        if (filter === void 0) { filter = function (a) { return true; }; }
        var ts = Date.now();
        var id = this.entryIDs[channel]++;
        var data = new JournalRecord(type, msg, id, ts);
        var success = new Array(this.connections[channel].length);
        this.connections[channel].forEach(function (conn, i) {
            success[i] = !filter(conn) || conn.writeJournalRecord(data);
        });
        for (var i = success.length - 1; i > -1; i--)
            if (!success[i])
                this.connections[channel].splice(i, 1);
        this.records[channel].push(data);
        this.cleanJournal(data.Timestamp, channel);
        return data;
    };
    Journal.prototype.emitter = function (request, response, state) {
        var conn = { request: request, response: response, state: state };
        var channel = state.params[0];
        this.initjournal(channel);
        var event = state.params[1];
        var data = this.emitEvent(channel, event, state.data, this.emitterFilter(conn));
        response.writeHead(200);
        response.write(data.EntryID + "\n" + data.Timestamp);
        response.end();
    };
    Journal.prototype.emitterExports = function (method, prefix, handler) {
        if (handler === void 0) { handler = this.emitter.bind(this); }
        return {
            bodyFormat: "string",
            method: method,
            handler: handler,
            path: new RegExp("^/events/" + prefix + "/([^/]+)/([^/]+)$")
        };
    };
    return Journal;
}());
exports.Journal = Journal;
var JournalRecord = /** @class */ (function () {
    function JournalRecord(Type, Data, EntryID, Timestamp) {
        this.Type = Type;
        this.Data = Data;
        this.EntryID = EntryID;
        this.Timestamp = Timestamp;
    }
    Object.defineProperty(JournalRecord.prototype, "EventIDString", {
        get: function () {
            return this.Timestamp.toString() + this.EntryID.toString();
        },
        enumerable: false,
        configurable: true
    });
    return JournalRecord;
}());
exports.JournalRecord = JournalRecord;
var SSEClient = /** @class */ (function () {
    function SSEClient(request, response, state) {
        this.request = request;
        this.response = response;
        this.state = state;
        response.on("error", this.onerror.bind(this));
        response.on("close", this.onclose.bind(this));
    }
    Object.defineProperty(SSEClient, "retryInterval", {
        get: function () {
            return $tw.Syncer.prototype.errorRetryInterval;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SSEClient.prototype, "channel", {
        get: function () {
            return this.state.params[0];
        },
        enumerable: false,
        configurable: true
    });
    SSEClient.prototype.onerror = function (err) {
        console.log("response error", err.message);
        this.response.destroy();
        this.onended && this.onended();
    };
    SSEClient.prototype.onclose = function () {
        this.end();
        this.onended && this.onended();
    };
    SSEClient.prototype.start = function (statusCode, headers, eventID) {
        if (statusCode === void 0) { statusCode = 200; }
        if (headers === void 0) { headers = {}; }
        if (eventID === void 0) { eventID = null; }
        if (this.ended())
            return false;
        this.response.writeHead(statusCode, $tw.utils.extend({
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "close",
        }, headers));
        this.response.write((eventID ? "id: " + eventID + "\n" : "")
            + "retry: " + SSEClient.retryInterval + "\n"
            + "\n\n", "utf8");
        return true;
    };
    SSEClient.prototype.writeJournalRecord = function (data) {
        return this.write(data.Type, data.Data.toString(), data.EventIDString);
    };
    SSEClient.prototype.write = function (event, data, eventID) {
        if (this.ended())
            return false;
        if (typeof event !== "string" || event.indexOf("\n") !== -1) {
            throw new Error("Type must be a single-line string");
        }
        if (typeof data !== "string") {
            throw new Error("Data must be a string");
        }
        this.response.write("event: " + event + "\n"
            + data.split('\n').map(function (e) { return "data: " + e; }).join('\n') + "\n"
            + (eventID ? "id: " + eventID + "\n" : "")
            + "retry: " + SSEClient.retryInterval + "\n"
            + "\n\n", "utf8");
        return true;
    };
    SSEClient.prototype.end = function () {
        if (this.ended())
            return false;
        this.response.end();
        return true;
    };
    SSEClient.prototype.ended = function () {
        var res = false;
        if (typeof this.response.writableEnded === "boolean") {
            res = res || this.response.writableEnded;
        }
        else if (typeof this.response.finished === "boolean") {
            res = res || this.response.finished;
        }
        return res;
    };
    return SSEClient;
}());
exports.SSEClient = SSEClient;
