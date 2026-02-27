/*\
title: test-server-get-routes.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for server-side GET API routes

\*/

"use strict";

// Only include in Node.js environment, otherwise will cause playwright tests to fail
if($tw.node) {

	const Server = require("$:/core/modules/server/server.js").Server;

	describe("Server GET API Routes", () => {

		let serverInstance = null;
		let nodeServer = null;
		const baseUrl = "http://127.0.0.1:8082";

		beforeAll(() => {
			if(!$tw.node) {
				return;
			}

			// In Node.js environment, start a test server
			serverInstance = new Server({
				wiki: $tw.wiki,
				variables: {
					port: "8082",
					host: "127.0.0.1",
					"csrf-disable": "yes",
					"readers": "(anon)",
					"suppress-server-logs": "yes"
				}
			});
			nodeServer = serverInstance.listen();
			if(typeof nodeServer.requestTimeout !== "undefined") {
				nodeServer.requestTimeout = 0;
			}

			// Set server to not prevent process exit
			nodeServer.unref();
		});

		// Stop server after all tests
		afterAll(() => new Promise(resolve => {
			if(nodeServer) {
				if(typeof nodeServer.closeAllConnections === "function") {
					nodeServer.closeAllConnections();
				}
				nodeServer.close(resolve);
			} else {
				resolve();
			}
		}));

		describe("GET /:title (get-tiddler-html)", () => {

			beforeAll(() => {
				// Create test tiddlers
				$tw.wiki.addTiddler(new $tw.Tiddler({
					title: "TestRenderTiddler",
					text: "Current tiddler is: <<currentTiddler>>"
				}));
				$tw.wiki.addTiddler(new $tw.Tiddler({
					title: "TestRenderWithVariable",
					text: "Variable value: <<myVar>>"
				}));
			});

			it("should render tiddler with default currentTiddler", async () => {
				const response = await fetch(baseUrl + "/TestRenderTiddler");
				const text = await response.text();

				expect(response.ok).toBe(true);
				expect(text).toContain("Current tiddler is: TestRenderTiddler");
			});

			it("should render tiddler with URL parameter variables", async () => {
				const response = await fetch(baseUrl + "/TestRenderWithVariable?myVar=HelloWorld");
				const text = await response.text();

				expect(response.ok).toBe(true);
				expect(text).toContain("Variable value: HelloWorld");
			});

			it("should allow overriding currentTiddler via URL parameter", async () => {
				const response = await fetch(baseUrl + "/TestRenderTiddler?currentTiddler=TestRenderWithVariable");
				const text = await response.text();

				expect(response.ok).toBe(true);
				// The URL still requests TestRenderTiddler, but currentTiddler variable is overridden
				// This affects the template rendering, so we check the title reflects the override
				expect(text).toContain("TestRenderWithVariable");
			});

			it("should support multiple URL parameters", async () => {
				$tw.wiki.addTiddler(new $tw.Tiddler({
					title: "TestMultipleVars",
					text: "Var1: <<var1>>, Var2: <<var2>>"
				}));

				const response = await fetch(baseUrl + "/TestMultipleVars?var1=Value1&var2=Value2");
				const text = await response.text();

				expect(response.ok).toBe(true);
				expect(text).toContain("Var1: Value1");
				expect(text).toContain("Var2: Value2");
			});

			it("should return 404 for non-existent tiddler", async () => {
				const response = await fetch(baseUrl + "/NonExistentTiddler" + Date.now());

				expect(response.status).toBe(404);
			});
		});
	});

}
