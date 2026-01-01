/*\
title: test-server-http2.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for HTTP/2 and h2c (HTTP/2 Cleartext) support in TiddlyWiki server

This test suite verifies:
- HTTP/2 with TLS (requires certificates)
- HTTP/2 Cleartext (h2c) without TLS
- Automatic fallback to HTTP/1.1
- Protocol detection and compatibility

\*/
"use strict";

// Only include in Node.js environment
if($tw.node) {
	var Server = require("$:/core/modules/server/server.js").Server;
	var fs = require("fs");
	var path = require("path");
	var https = require("https");
	var http2 = require("http2");

	describe("Server HTTP/2 Support", function() {
		var testPort = 8091;
		var h2cPort = 8092;
		var h2cUrl = "http://127.0.0.1:" + h2cPort;

		describe("HTTP/2 Configuration", function() {
			it("should have http2 default variable set to 'yes'", function() {
				var server = new Server({
					wiki: $tw.wiki,
					variables: {
						port: testPort.toString(),
						"suppress-server-logs": "yes"
					}
				});
				expect(server.get("http2")).toBe("yes");
				expect(server.get("h2c")).toBe("no");
			});

			it("should not enable connection tracking by default (production mode)", function() {
				var server = new Server({
					wiki: $tw.wiki,
					variables: {
						port: testPort.toString(),
						"suppress-server-logs": "yes"
					}
				});
				// Connection tracking should be disabled by default
				expect(server.enableConnectionTracking).toBe(false);
				// getConnectionStats should return null when tracking is disabled
				expect(server.getConnectionStats()).toBe(null);
			});

			it("should enable connection tracking only when explicitly requested", function() {
				var server = new Server({
					wiki: $tw.wiki,
					variables: {
						port: testPort.toString(),
						"connection-tracking": "yes",
						"suppress-server-logs": "yes"
					}
				});
				// Connection tracking should be enabled
				expect(server.enableConnectionTracking).toBe(true);
				// getConnectionStats should return stats object
				var stats = server.getConnectionStats();
				expect(stats).not.toBe(null);
				expect(stats.http1Connections).toBe(0);
				expect(stats.http2Sessions).toBe(0);
			});

			it("should fallback to HTTP/1.1 when no certificates and http2=yes", function() {
				var server = new Server({
					wiki: $tw.wiki,
					variables: {
						port: testPort.toString(),
						"http2": "yes",
						"suppress-server-logs": "yes"
					}
				});
				// Without certificates and h2c, should fall back to HTTP/1.1
				expect(server.protocol).toBe("http");
				expect(server.useHttp2).toBe(false);
				expect(server.useH2c).toBe(false);
				expect(server.transport).toBe(require("http"));
			});

			it("should enable h2c when h2c=yes and http2 module is available", function() {
				var server = new Server({
					wiki: $tw.wiki,
					variables: {
					port: testPort.toString(),
					"h2c": "yes",
					"suppress-server-logs": "yes"
				}
				});
				// With h2c=yes, should enable HTTP/2 Cleartext
				expect(server.protocol).toBe("http");
				expect(server.useH2c).toBe(true);
				expect(server.transport).toBe(http2);
			});
			it("should not enable both http2 and h2c simultaneously", function() {
				var server = new Server({
					wiki: $tw.wiki,
					variables: {
						port: testPort.toString(),
						"http2": "yes",
						"h2c": "yes",
						"suppress-server-logs": "yes"
					}
				});
				// h2c takes precedence when both are enabled (no certificates case)
				// or http2 takes precedence (with certificates case)
				var http2Count = (server.useHttp2 ? 1 : 0) + (server.useH2c ? 1 : 0);
				expect(http2Count).toBeLessThanOrEqual(1);
			});
		});

		describe("h2c (HTTP/2 Cleartext) Server", function() {
			var serverInstance = null;
			var nodeServer = null;
			var client = null;

			afterEach(function(done) {
				if(client) {
					client.close();
					client = null;
				}
				if(nodeServer) {
					nodeServer.close(function() {
						serverInstance = null;
						nodeServer = null;
						done();
					});
				} else {
					done();
				}
			});

			it("should start h2c server successfully", function(done) {
				serverInstance = new Server({
					wiki: $tw.wiki,
					variables: {
						port: h2cPort.toString(),
						host: "127.0.0.1",
						"h2c": "yes",
						"suppress-server-logs": "yes"
					}
				});

				expect(serverInstance.useH2c).toBe(true);
				nodeServer = serverInstance.listen();
				expect(nodeServer).toBeDefined();
				if(nodeServer) {
					nodeServer.unref();
					// Give server time to start
					setTimeout(done, 100);
				} else {
					done();
				}
			});

			it("should handle HTTP requests on h2c server", async function() {
				serverInstance = new Server({
					wiki: $tw.wiki,
					variables: {
						port: h2cPort.toString(),
						host: "127.0.0.1",
						"h2c": "yes",
						"csrf-disable": "yes",
						"suppress-server-logs": "yes"
					}
				});

				nodeServer = serverInstance.listen();
				nodeServer.unref();

				// Wait for server listening event
				await new Promise(function(resolve) {
					nodeServer.on("listening", resolve);
				});

				// Use HTTP/2 client to connect to h2c server
				client = http2.connect(h2cUrl);
				var data = await new Promise(function(resolve, reject) {
					var req = client.request({
						":method": "GET",
						":path": "/status"
					});
					var data = "";
					req.on("data", function(chunk) {
						data += chunk;
					});
					req.on("end", function() {
						resolve(data);
					});
					req.on("error", reject);
					req.end();
				});

				var json = JSON.parse(data);
				expect(json.tiddlywiki_version).toBeDefined();
			});

			it("should correctly handle HTTP/2 pseudo-headers", async function() {
				// This test verifies that Node.js HTTP/2 correctly maps pseudo-headers
				// to request.method and request.url properties
				var testServer = new Server({
					wiki: $tw.wiki,
					variables: {
						port: (h2cPort + 1).toString(),
						host: "127.0.0.1",
						"h2c": "yes",
						"csrf-disable": "yes",
						"suppress-server-logs": "yes"
					}
				});

				var testNodeServer = testServer.listen();
				testNodeServer.unref();

				// Wait for server to start listening
				await new Promise(function(resolve) {
					testNodeServer.on("listening", resolve);
				});

				// Intercept request to verify properties
				var originalHandler = testServer.requestHandler.bind(testServer);
				testServer.requestHandler = function(request, response, options) {
					// Verify that Node.js http2 provides method and url directly
					expect(request.method).toBeDefined();
					expect(request.method).toBe("GET");
					expect(request.url).toBeDefined();
					expect(request.url).toContain("/status");
					
					// Verify that pseudo-headers are NOT in request.headers
					// (they should be stripped by Node.js http2 implementation)
					expect(request.headers[":method"]).toBeUndefined();
					expect(request.headers[":path"]).toBeUndefined();
					
					// Call original handler
					originalHandler(request, response, options);
				};

				// Use client2 instead of shared client variable because this test uses a different port (h2cPort + 1)
				// and manages its own server lifecycle independently from afterEach cleanup
				var client2 = http2.connect("http://127.0.0.1:" + (h2cPort + 1));
				await new Promise(function(resolve, reject) {
					var req = client2.request({
						":method": "GET",
						":path": "/status"
					});

					req.on("data", function() {});
					req.on("end", resolve);
					req.on("error", reject);
					req.end();
				});

				client2.close();
				await new Promise(function(resolve) {
					testNodeServer.close(resolve);
				});
			});
		});

		describe("HTTP/2 Multiplexing Performance", function() {
			var serverInstance = null;
			var nodeServer = null;
			var client = null;
			var testTiddlerCount = 50;

			beforeAll(function(done) {
				// Create test tiddlers
				for(var i = 1; i <= testTiddlerCount; i++) {
					$tw.wiki.addTiddler(new $tw.Tiddler({
						title: "TestTiddler-HTTP2-" + i,
						text: "Test content " + i,
						tags: ["test-http2"]
					}));
				}

				// Start server with connection tracking enabled (for testing)
				serverInstance = new Server({
					wiki: $tw.wiki,
					variables: {
						port: h2cPort.toString(),
						host: "127.0.0.1",
						"h2c": "yes",
						"csrf-disable": "yes",
						"suppress-server-logs": "yes",
						"connection-tracking": "yes"
					}
				});

				nodeServer = serverInstance.listen();
				nodeServer.unref();
				nodeServer.on("listening", done);
			});

			afterAll(function(done) {
				for(var i = 1; i <= testTiddlerCount; i++) {
					$tw.wiki.deleteTiddler("TestTiddler-HTTP2-" + i);
				}
				nodeServer.close(done);
			});

			afterEach(function() {
				if(client) {
					client.close();
					client = null;
				}
			});

				it("should create only ONE HTTP/2 session for multiple concurrent requests", async function() {
				// Reset connection stats before test
				serverInstance.resetConnectionStats();
				client = http2.connect(h2cUrl);
				var requestCount = 20;

				// Create array of request promises using Array.from for cleaner code
				var requestPromises = Array.from({length: requestCount}, function(_, i) {
					var index = i + 1;  // 1-indexed
					return new Promise(function(resolve, reject) {
						var req = client.request({
							":method": "GET",
							":path": "/recipes/default/tiddlers/TestTiddler-HTTP2-" + index
						});

						var data = "";
						req.on("data", function(chunk) { data += chunk; });
						req.on("end", function() {
							try {
								resolve(JSON.parse(data));
							} catch(err) {
								reject(err);
							}
						});
						req.on("error", reject);
						req.end();
					});
				});

				var responses = await Promise.all(requestPromises);
				// Verify all responses received correctly
				expect(responses.length).toBe(requestCount);
				// Verify each response has the correct title
				// Promise.all preserves order, so responses[0] is request 1, etc.
				responses.forEach(function(response, idx) {
					expect(response.title).toBe("TestTiddler-HTTP2-" + (idx + 1));
				});
				// KEY TEST: Verify server only created ONE HTTP/2 session
				var stats = serverInstance.getConnectionStats();
				expect(stats.http2Sessions).toBe(1);
				expect(stats.http1Connections).toBe(0);
			});

			it("should reuse same socket for all requests on single connection", async function() {
				client = http2.connect(h2cUrl);
				var requestCount = 10;
				
				// Wait for connection to establish
				await new Promise(function(resolve) {
					client.on("connect", resolve);
				});

				var socket = client.socket;
				expect(socket).toBeDefined();
				// Socket properties might not be available immediately
				// Just verify the socket object itself is reused
				var requestPromises = [];
				for(var i = 1; i <= requestCount; i++) {
					requestPromises.push(new Promise(function(resolve, reject) {
						var req = client.request({
							":method": "GET",
							":path": "/status"
						});

						req.on("data", function() {});
						req.on("end", function() {
							// Verify still using same socket object
							expect(client.socket).toBe(socket);
							resolve();
						});
						req.on("error", reject);
						req.end();
					}));
				}

				await Promise.all(requestPromises);
			});

			it("should demonstrate parallel execution with HTTP/2 multiplexing", async function() {
				// This test shows that HTTP/2 can send multiple requests in parallel
				// On localhost, the speed difference is minimal, but we can verify
				// that concurrent execution doesn't take 2x the time of a single request
				client = http2.connect(h2cUrl);
				var requestCount = 10;
				
				// First: measure time for a single request (baseline)
				var singleStart = Date.now();
				await new Promise(function(resolve, reject) {
					var req1 = client.request({
						":method": "GET",
						":path": "/recipes/default/tiddlers/TestTiddler-HTTP2-1"
					});
					req1.on("data", function() {});
					req1.on("end", resolve);
					req1.on("error", reject);
					req1.end();
				});
				var singleTime = Date.now() - singleStart;

				// Then: send multiple requests concurrently
				var concurrentStart = Date.now();
				var concurrentPromises = Array.from({length: requestCount}, function(_, i) {
					var index = i + 1;  // 1-indexed
					return new Promise(function(resolve, reject) {
						var req = client.request({
							":method": "GET",
							":path": "/recipes/default/tiddlers/TestTiddler-HTTP2-" + index
						});
						var data = "";
						req.on("data", function(chunk) { data += chunk; });
						req.on("end", function() { resolve(data.length); });
						req.on("error", reject);
						req.end();
					});
				});
				await Promise.all(concurrentPromises);
				var concurrentTime = Date.now() - concurrentStart;
				
				// With HTTP/2 multiplexing, N concurrent requests should NOT take N times longer
				// Due to localhost speed, we just verify it's reasonably fast
				// In real world with network latency, the difference would be dramatic
				var ratio = concurrentTime / singleTime;
				// Concurrent should not be N times slower (that would indicate sequential execution)
				// Allow some overhead, but it should be much less than N times
				expect(ratio).toBeLessThan(requestCount * 0.5);
			});
		});
	});
}

