/*\
title: test-server-files.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for static file browser caching.

\*/
"use strict";

if($tw.node) {

	describe("Static file browser caching",function() {

		const fs = require("fs"),
			path = require("path"),
			http = require("http"),
			Server = require("$:/core/modules/server/server.js").Server;
		let directory, filename, server, listener;

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
				http.get({hostname: "127.0.0.1", port: listener.address().port, path: "/files/test.txt", headers: headers || {}, agent: false},function(response) {
					let body = "";
					response.setEncoding("utf8");
					response.on("data",function(chunk) {body += chunk;});
					response.on("end",function() {
						resolve({status: response.statusCode, headers: response.headers, body: body});
					});
					response.on("error",reject);
				}).on("error",reject);
			});
		}

		it("revalidates cached files and detects size and mtime changes",async function() {
			let response = await getFile();
			expect(response.status).toBe(200);
			expect(response.body).toBe("hello");
			expect(response.headers.etag).toMatch(/^W\/".+"$/);
			expect(response.headers["cache-control"]).toBe("max-age=0, must-revalidate");
			expect(response.headers["content-length"]).toBe("5");
			expect(response.headers["content-type"]).toBe("text/plain");
			const etag = response.headers.etag;
			spyOn(fs,"createReadStream").and.callThrough();
			const cached = await Promise.all([etag, etag.slice(2), '"old", ' + etag, "*"].map(function(value) {
				return getFile({"if-none-match": value, range: "bytes=1-3"});
			}));
			cached.forEach(function(result) {
				expect(result.status).toBe(304);
				expect(result.body).toBe("");
				expect(result.headers.etag).toBe(etag);
				expect(result.headers["cache-control"]).toBe("max-age=0, must-revalidate");
			});
			expect(fs.createReadStream.calls.count()).toBe(0);
			async function checkUpdate(text,mtime) {
				fs.writeFileSync(filename,text);
				fs.utimesSync(filename,1000,mtime);
				const updated = await getFile({"if-none-match": response.headers.etag});
				expect(updated.status).toBe(200);
				expect(updated.body).toBe(text);
				expect(updated.headers.etag).not.toBe(response.headers.etag);
				response = updated;
			}
			await checkUpdate("hello world",1000);
			await checkUpdate("hello again",2000);
		});

		it("serves the file when browser caching is disabled",async function() {
			server.enableBrowserCache = false;
			const response = await getFile({"if-none-match": "*"});
			expect(response.status).toBe(200);
			expect(response.body).toBe("hello");
			expect(response.headers.etag).toBeUndefined();
		});

		it("handles valid and invalid byte ranges",async function() {
			let response = await getFile({"if-none-match": '"old"', range: "bytes=1-3"});
			expect(response.status).toBe(206);
			expect(response.body).toBe("ell");
			expect(response.headers["content-range"]).toBe("bytes 1-3/5");
			expect(response.headers["content-length"]).toBe("3");
			response = await getFile({range: "bytes=5-6"});
			expect(response.status).toBe(416);
			expect(response.headers["content-range"]).toBe("bytes */5");
		});

	});

}
