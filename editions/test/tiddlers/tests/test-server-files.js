/*\
title: test-server-files.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for static file browser caching.

\*/
"use strict";

if($tw.node) {

	describe("Static file browser caching",function() {

		var fs = require("fs"),
			path = require("path"),
			http = require("http"),
			Server = require("$:/core/modules/server/server.js").Server,
			directory, filename, server, listener;

		beforeEach(function(done) {
			directory = fs.mkdtempSync(path.join(require("os").tmpdir(),"tw-test-files-"));
			fs.mkdirSync(path.join(directory,"files"));
			filename = path.join(directory,"files","test.txt");
			fs.writeFileSync(filename,"hello");
			fs.utimesSync(filename,1000,1000);
			server = new Server({wiki: $tw.wiki, boot: {wikiPath: directory}, variables: {"use-browser-cache": "yes"}});
			listener = http.createServer(server.requestHandler.bind(server)).listen(0,"127.0.0.1",done);
		});

		afterEach(function(done) {
			listener.close(function() {
				fs.rmSync(directory,{recursive: true, force: true});
				done();
			});
		});

		function getFile(headers) {
			return new Promise(function(resolve,reject) {
				http.get({hostname: "127.0.0.1", port: listener.address().port, path: "/files/test.txt", headers: headers || {}},function(response) {
					var body = "";
					response.setEncoding("utf8");
					response.on("data",function(chunk) {body += chunk;});
					response.on("end",function() {
						resolve({status: response.statusCode, headers: response.headers, body: body});
					});
					response.on("error",reject);
				}).on("error",reject);
			});
		}

		it("serves the file with cache headers",async function() {
			var response = await getFile();
			expect(response.status).toBe(200);
			expect(response.body).toBe("hello");
			expect(response.headers.etag).toMatch(/^W\/".+"$/);
			expect(response.headers["cache-control"]).toBe("max-age=0, must-revalidate");
			expect(response.headers["content-length"]).toBe("5");
			expect(response.headers["content-type"]).toBe("text/plain");
		});

		["matching", "strong", "list", "wildcard"].forEach(function(condition) {
			it("returns 304 for a " + condition + " If-None-Match",async function() {
				var original = await getFile(),
					etag = original.headers.etag || '"missing"',
					values = {matching: etag, strong: etag.slice(2), list: '"old", ' + etag, wildcard: "*"},
					headers = {"if-none-match": values[condition]};
				if(condition === "list") {
					headers.range = "bytes=1-3";
				}
				spyOn(fs,"createReadStream").and.callThrough();
				var response = await getFile(headers);
				expect(response.status).toBe(304);
				expect(response.body).toBe("");
				expect(response.headers.etag).toBe(etag);
				expect(response.headers["cache-control"]).toBe("max-age=0, must-revalidate");
				expect(fs.createReadStream.calls.count()).toBe(0);
			});
		});

		["size", "mtime"].forEach(function(change) {
			it("serves the updated file when its " + change + " changes",async function() {
				var original = await getFile(),
					text = change === "size" ? "hello world" : "world";
				fs.writeFileSync(filename,text);
				fs.utimesSync(filename,1000,change === "size" ? 1000 : 2000);
				var response = await getFile({"if-none-match": original.headers.etag || '"missing"'});
				expect(response.status).toBe(200);
				expect(response.body).toBe(text);
				expect(response.headers.etag).not.toBe(original.headers.etag);
			});
		});

		it("serves the file when browser caching is disabled",async function() {
			server.enableBrowserCache = false;
			var response = await getFile({"if-none-match": "*"});
			expect(response.status).toBe(200);
			expect(response.body).toBe("hello");
			expect(response.headers.etag).toBeUndefined();
		});

		it("serves a byte range for a stale ETag",async function() {
			var response = await getFile({"if-none-match": '"old"', range: "bytes=1-3"});
			expect(response.status).toBe(206);
			expect(response.body).toBe("ell");
			expect(response.headers["content-range"]).toBe("bytes 1-3/5");
			expect(response.headers["content-length"]).toBe("3");
		});

		it("returns 416 for an invalid byte range",async function() {
			var response = await getFile({range: "bytes=5-6"});
			expect(response.status).toBe(416);
			expect(response.headers["content-range"]).toBe("bytes */5");
		});

	});

}
