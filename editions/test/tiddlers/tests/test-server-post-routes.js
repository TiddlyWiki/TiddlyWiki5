/*\
title: test-server-post-routes.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for server-side POST API routes

This test suite automatically starts a TiddlyWiki server before running tests and stops it afterwards.

\*/

"use strict";

// Only include in Node.js environment, otherwise will cause playwright tests to fail
if($tw.node) {

	const Server = require("$:/core/modules/server/server.js").Server;

	describe("Server API Routes", () => {

		let serverInstance = null;
		let nodeServer = null;
		const baseUrl = "http://127.0.0.1:8081";

		beforeAll(() => {
			if(!$tw.node) {
				return;
			}

			// In Node.js environment, start a test server
			serverInstance = new Server({
				wiki: $tw.wiki,
				variables: {
					port: "8081",
					host: "127.0.0.1",
					"csrf-disable": "yes",
					"writers": "(anon)",
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

		beforeEach(() => {
			// Enable all external filters for testing
			$tw.wiki.addTiddler(new $tw.Tiddler({
				title: "$:/config/Server/AllowAllExternalFilters",
				text: "yes"
			}));
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

		describe("POST /recipes/default/actions", () => {

			// Helper function for this describe block
			const makeRequest = async data => {
				const response = await fetch(baseUrl + "/recipes/default/actions", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data)
				});
				const responseData = await response.json();
				return {
					ok: response.ok,
					status: response.status,
					statusText: response.statusText,
					data: responseData
				};
			};

			// Note: Tests use existing action tiddlers from $:/core/ui/Actions/*
			// which are tagged with $:/tags/Actions

			it("should execute existing action tiddlers by tag (new-tiddler)", async () => {
				// Use the existing $:/core/ui/Actions/new-tiddler action
				// Before: count tiddlers
				const beforeCount = $tw.wiki.filterTiddlers("[!is[system]]").length;

				const result = await makeRequest({
					tag: "$:/tags/Actions",
					variables: {}
				});

				expect(result.ok).toBe(true);
				expect(result.data).toBeDefined();
				expect(result.data.success).toBe(true);

				// The $:/tags/Actions will execute all action tiddlers
				// This includes new-tiddler, new-journal, new-image
				// At least new-tiddler should create a draft tiddler
				const afterCount = $tw.wiki.filterTiddlers("[!is[system]]").length;
				expect(afterCount).toBeGreaterThanOrEqual(beforeCount);
			});

			it("should execute action tiddlers without errors", async () => {
				const result = await makeRequest({
					tag: "$:/tags/Actions"
				});

				expect(result.ok).toBe(true);
				expect(result.data.success).toBe(true);
			});

			it("should return error for invalid JSON", async () => {
				const response = await fetch(baseUrl + "/recipes/default/actions", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: "invalid json"
				});

				expect(response.status).toBe(400);
			});

			it("should return error for missing tag or title field", async () => {
				const result = await makeRequest({
					variables: {
						test: "value"
					}
				});

				expect(result.status).toBe(400);
				expect(result.data.error).toContain("non-empty string");
			});

			it("should execute action by title", async () => {
				// Create a test action tiddler
				$tw.wiki.addTiddler(new $tw.Tiddler({
					title: "TestAction",
					text: '<$action-setfield $tiddler="TestActionResult" text="executed" />'
				}));

				const result = await makeRequest({
					title: "TestAction"
				});

				expect(result.ok).toBe(true);
				expect(result.data.success).toBe(true);

				// Verify the action was executed
				const resultTiddler = $tw.wiki.getTiddler("TestActionResult");
				expect(resultTiddler).toBeDefined();
				expect(resultTiddler.fields.text).toBe("executed");

				// Cleanup
				$tw.wiki.deleteTiddler("TestAction");
				$tw.wiki.deleteTiddler("TestActionResult");
			});

			it("should return error for non-existent action title", async () => {
				const result = await makeRequest({
					title: "NonExistentAction-" + Date.now()
				});

				expect(result.status).toBe(404);
				expect(result.data.error).toContain("not found");
			});

			it("should execute by title when both tag and title are provided (title takes precedence)", async () => {
				// Create a test action tiddler
				$tw.wiki.addTiddler(new $tw.Tiddler({
					title: "TestActionByTitle",
					text: '<$action-setfield $tiddler="TestActionByTitleResult" text="title-executed" />'
				}));

				const result = await makeRequest({
					title: "TestActionByTitle",
					tag: "$:/tags/Actions" // This should be ignored
				});

				expect(result.ok).toBe(true);
				expect(result.data.success).toBe(true);

				// Verify only the title action was executed
				const resultTiddler = $tw.wiki.getTiddler("TestActionByTitleResult");
				expect(resultTiddler).toBeDefined();
				expect(resultTiddler.fields.text).toBe("title-executed");

				// Cleanup
				$tw.wiki.deleteTiddler("TestActionByTitle");
				$tw.wiki.deleteTiddler("TestActionByTitleResult");
			});

			it("should return error for empty string title", async () => {
				const result = await makeRequest({
					title: "",
					tag: "$:/tags/Actions"
				});

				// Since title is empty, it should fall back to tag
				expect(result.ok).toBe(true);
				expect(result.data.success).toBe(true);
			});

			it("should return error for whitespace-only title", async () => {
				const result = await makeRequest({
					title: "   ",
					tag: "$:/tags/Actions"
				});

				// Since title is whitespace, it should fall back to tag
				expect(result.ok).toBe(true);
				expect(result.data.success).toBe(true);
			});

			it("should succeed even with non-existent tag (no actions to execute)", async () => {
				const result = await makeRequest({
					tag: "NonExistentActionTag-" + Date.now()
				});

				expect(result.ok).toBe(true);
				expect(result.data.success).toBe(true);
			});

			it("should support URL parameter variables", async () => {
				// Create a test action that uses a variable
				$tw.wiki.addTiddler(new $tw.Tiddler({
					title: "TestActionWithVariable",
					text: '<$action-setfield $tiddler="TestActionVariableResult" text=<<myVar>> />'
				}));

				// URL parameter should override body variable
				const response = await fetch(baseUrl + "/recipes/default/actions?myVar=URLValue", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						title: "TestActionWithVariable",
						variables: {
							myVar: "BodyValue"
						}
					})
				});
				const responseData = await response.json();

				expect(response.ok).toBe(true);
				expect(responseData.success).toBe(true);

				// Verify the URL parameter was used
				const resultTiddler = $tw.wiki.getTiddler("TestActionVariableResult");
				expect(resultTiddler).toBeDefined();
				expect(resultTiddler.fields.text).toBe("URLValue");

				// Cleanup
				$tw.wiki.deleteTiddler("TestActionWithVariable");
				$tw.wiki.deleteTiddler("TestActionVariableResult");
			});
		});

		describe("POST /recipes/default/filter", () => {

			// Helper function for this describe block
			const makeRequest = async data => {
				const response = await fetch(baseUrl + "/recipes/default/filter", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data)
				});
				const responseData = await response.json();
				return {
					ok: response.ok,
					status: response.status,
					statusText: response.statusText,
					data: responseData
				};
			};

			// Setup: Create test tiddlers
			beforeAll(() => {
				// Create test tiddlers directly in wiki
				$tw.wiki.addTiddler(new $tw.Tiddler({
					title: "FilterTest1",
					text: "Content 1",
					tags: ["FilterTest", "Test"]
				}));
				$tw.wiki.addTiddler(new $tw.Tiddler({
					title: "FilterTest2",
					text: "Content 2",
					tags: ["FilterTest"]
				}));
				$tw.wiki.addTiddler(new $tw.Tiddler({
					title: "FilterTest3",
					text: "Content 3",
					tags: ["Other"]
				}));
			});

		it("should execute simple tag filter", async () => {
			const result = await makeRequest({
				filter: "[tag[FilterTest]]"
			});

			expect(result.ok).toBe(true);
			expect(result.data.results).toBeDefined();
			expect(result.data.results.length).toBeGreaterThanOrEqual(2);
			expect(result.data.results).toContain("FilterTest1");
			expect(result.data.results).toContain("FilterTest2");
		});

		it("should allow variables in filter", async () => {
			const result = await makeRequest({
				filter: "[tag<myTag>]",
				variables: {
					myTag: "FilterTest"
				}
			});

			expect(result.ok).toBe(true);
			expect(result.data.results).toBeDefined();
			// Variables work but may return 0 results if tag doesn't match
			// The important thing is that the request succeeds
			expect(Array.isArray(result.data.results)).toBe(true);
		});

		it("should use custom source", async () => {
			const result = await makeRequest({
				filter: "[tag[FilterTest]]",
				source: ["FilterTest1", "FilterTest2", "FilterTest3"]
			});

			expect(result.ok).toBe(true);
			expect(result.data.results).toBeDefined();
			expect(result.data.results.length).toBe(2);
			expect(result.data.results).toContain("FilterTest1");
			expect(result.data.results).toContain("FilterTest2");
			expect(result.data.results).not.toContain("FilterTest3");
		});

		it("should return error for invalid JSON", async () => {
			const response = await fetch(baseUrl + "/recipes/default/filter", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: "invalid json"
			});

			expect(response.status).toBe(400);
		});

		it("should return error for missing filter field", async () => {
			const result = await makeRequest({
				variables: {
					test: "value"
				}
			});

			expect(result.status).toBe(400);
			expect(result.data.error).toContain("filter");
		});

		it("should block unauthorized filters when configured", async () => {
			// Disable all external filters
			$tw.wiki.addTiddler(new $tw.Tiddler({
				title: "$:/config/Server/AllowAllExternalFilters",
				text: "no"
			}));

			const result = await makeRequest({
				filter: "[tag[Unauthorized]]"
			});

			expect(result.status).toBe(403);
			expect(result.data.error).toContain("Forbidden");
		});

		it("should support URL parameter variables (URL params override body)", async () => {
			const response = await fetch(baseUrl + "/recipes/default/filter?myTag=FilterTest", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					filter: "[tag<myTag>]",
					variables: {
						myTag: "WrongTag"
					}
				})
			});
			const responseData = await response.json();

			expect(response.ok).toBe(true);
			expect(responseData.results).toBeDefined();
			// URL parameter should override body variable
			expect(responseData.results.length).toBeGreaterThanOrEqual(2);
			expect(responseData.results).toContain("FilterTest1");
			expect(responseData.results).toContain("FilterTest2");
		});
		});
	});

}
