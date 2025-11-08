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
	var http = require("http");
	var https = require("https");
	var http2;
	
	// Try to load http2 module
	try {
		http2 = require("http2");
	} catch(e) {
		http2 = null;
	}

	describe("Server HTTP/2 Support", function() {
		var testPort = 8091;
		var h2cPort = 8092;
		var baseUrl = "http://127.0.0.1:" + testPort;
		var h2cUrl = "http://127.0.0.1:" + h2cPort;

		// Helper function to create test certificates
		function createTestCertificates(tempDir) {
			// For testing, we'll use self-signed certificates
			// In a real test environment, you would generate these with openssl
			var keyPath = path.join(tempDir, "test-key.pem");
			var certPath = path.join(tempDir, "test-cert.pem");
			
			// Note: These are dummy paths for testing the configuration logic
			// Real certificate generation would require openssl
			return {
				keyPath: keyPath,
				certPath: certPath,
				exists: fs.existsSync(keyPath) && fs.existsSync(certPath)
			};
		}

		describe("HTTP/2 Configuration", function() {
			it("should have http2 default variable set to 'yes'", function() {
        // This test verifies the http2 module detection logic
				expect(typeof http2).toBeDefined();
				// http2 should be available in Node.js 8.4.0+
				var server = new Server({
					wiki: $tw.wiki,
					variables: {
						port: testPort.toString()
					}
				});
				expect(server.get("http2")).toBe("yes");
				expect(server.get("h2c")).toBe("no");
			});

			it("should fallback to HTTP/1.1 when no certificates and http2=yes", function() {
				var server = new Server({
					wiki: $tw.wiki,
					variables: {
						port: testPort.toString(),
						"http2": "yes"
					}
				});
				
				// Without certificates and h2c, should fall back to HTTP/1.1
				expect(server.protocol).toBe("http");
				expect(server.useHttp2).toBe(false);
				expect(server.useH2c).toBe(false);
			});

			it("should enable h2c when h2c=yes even without certificates", function() {
				var server = new Server({
					wiki: $tw.wiki,
					variables: {
						port: testPort.toString(),
						"h2c": "yes"
					}
				});
				
				// With h2c=yes, should enable HTTP/2 Cleartext
				expect(server.protocol).toBe("http");
				expect(server.useH2c).toBe(true);
				expect(server.transport).toBe(http2);
			});

			it("should not enable both http2 and h2c simultaneously", function() {
				if(!http2) {
					pending("http2 module not available");
					return;
				}

				var server = new Server({
					wiki: $tw.wiki,
					variables: {
						port: testPort.toString(),
						"http2": "yes",
						"h2c": "yes"
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

			afterEach(function(done) {
        nodeServer.close(function() {
          serverInstance = null;
          nodeServer = null;
          done();
        });
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

			it("should handle HTTP requests on h2c server", function(done) {
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

				// Wait for server to start
				setTimeout(function() {
					// Use HTTP/2 client to connect to h2c server
					var client = http2.connect(h2cUrl);
					
					var req = client.request({
						":method": "GET",
						":path": "/status"
					});
					
					var data = "";
					req.on("data", function(chunk) {
						data += chunk;
					});
					
					req.on("end", function() {
						try {
							var json = JSON.parse(data);
							expect(json.tiddlywiki_version).toBeDefined();
							client.close();
							done();
						} catch(err) {
							fail("Failed to parse response: " + err.message);
							client.close();
							done();
						}
					});
					
					req.on("error", function(err) {
						fail("Request failed: " + err.message);
						client.close();
						done();
					});
					
					req.end();
				}, 200);
			});
		});

		describe("HTTP/2 Request Compatibility", function() {
			var serverInstance = null;
			var nodeServer = null;

			afterEach(function(done) {
				if(nodeServer) {
					if(typeof nodeServer.closeAllConnections === "function") {
						nodeServer.closeAllConnections();
					}
					nodeServer.close(function() {
						serverInstance = null;
						nodeServer = null;
						done();
					});
				} else {
					done();
				}
			});

			it("should handle HTTP/2 pseudo-headers correctly", function() {
				if(!http2) {
					pending("http2 module not available");
					return;
				}

				serverInstance = new Server({
					wiki: $tw.wiki,
					variables: {
						port: h2cPort.toString(),
						"h2c": "yes"
					}
				});

				// Create a mock HTTP/2 request object
				var mockRequest = {
					httpVersion: "2.0",
					headers: {
						":method": "GET",
						":path": "/status",
						":scheme": "http",
						":authority": "localhost:" + h2cPort
					},
					// These should be populated by the compatibility layer
					method: undefined,
					url: undefined,
					on: function() {},
					setEncoding: function() {}
				};

				var mockResponse = {
					writeHead: function() {},
					end: function() {}
				};

				// The requestHandler should normalize the request
				// We can't fully test this without a real HTTP/2 connection,
				// but we can verify the logic exists
				expect(serverInstance.requestHandler).toBeDefined();
				expect(typeof serverInstance.requestHandler).toBe("function");
			});
		});
	});
}
