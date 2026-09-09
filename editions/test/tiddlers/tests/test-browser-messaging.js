/*\
title: test-browser-messaging.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the PLUGIN-LIBRARY-READY handshake and legacy onload fallback.

\*/

"use strict";

describe("Browser Messaging", function() {

	it("should declare itself as a synchronous browser-only startup module", function() {
		var startup = require("$:/core/modules/browser-messaging.js");
		expect(startup.name).toBe("browser-messaging");
		expect(startup.platforms).toEqual(["browser"]);
		expect(startup.synchronous).toBe(true);
		expect(typeof startup.startup).toBe("function");
	});

	// loadIFrame()/flushCallbacks() are private to browser-messaging.js, so the only way
	// to exercise them for real is through $tw.rootWidget events and real postMessage
	// traffic with a real iframe, rather than re-implementing their logic here.
	describe("plugin library iframe handshake", function() {

		var urlsToUnload;

		beforeEach(function() {
			if(!$tw.browser) { return; }
			urlsToUnload = [];
		});

		afterEach(function() {
			if(!$tw.browser) { return; }
			urlsToUnload.forEach(function(url) {
				// Grab the DOM node before unloading clears the map entry, as a
				// belt-and-braces removal (unloadIFrame's own removal has an
				// unrelated off-by-one loop bug for small iframe counts).
				var info = $tw.browserMessaging.iframeInfoMap[url];
				$tw.rootWidget.dispatchEvent({type: "tm-unload-plugin-library", paramObject: {url: url}});
				if(info && info.domNode && info.domNode.parentNode) {
					info.domNode.parentNode.removeChild(info.domNode);
				}
				URL.revokeObjectURL(url);
			});
		});

		function makeChildUrl(script) {
			var blob = new Blob(["<script>" + script + "<\/script>"],{type: "text/html"});
			var url = URL.createObjectURL(blob);
			urlsToUnload.push(url);
			return url;
		}

		function waitUntil(predicate,done,description) {
			var attempts = 0;
			(function check() {
				if(predicate()) {
					done();
				} else if(++attempts > 400) {
					done.fail("Timed out waiting for: " + description);
				} else {
					setTimeout(check,20);
				}
			})();
		}

		it("should complete the real GET / GET-RESPONSE round trip once the child signals PLUGIN-LIBRARY-READY", function(done) {
			if(!$tw.browser) { pending("browser-only: requires a real iframe and postMessage - run in browser"); return; }

			// Mirrors plugins/tiddlywiki/pluginlibrary/libraryserver.js's real handshake and GET handling:
			// listener registration and the ready postMessage both happen synchronously, before <body> parses,
			// so onload (the legacy fallback below) cannot win this race for a well-behaved child.
			var url = makeChildUrl(
				"window.addEventListener('message',function(e){" +
                "if(e.data && e.data.verb === 'GET' && e.data.url === 'recipes/library/tiddlers.json'){" +
                "e.source.postMessage({verb:'GET-RESPONSE',status:'200',cookies:e.data.cookies,url:e.data.url," +
                "type:'application/json',body:JSON.stringify([{title:'ExamplePlugin',type:'application/json',text:'{}'}])},'*');" +
                "}});" +
                "window.parent.postMessage({verb:'PLUGIN-LIBRARY-READY'},'*');"
			);
			var expectedTitle = "$:/temp/RemoteAssetInfo/" + url + "/ExamplePlugin";

			$tw.rootWidget.dispatchEvent({
				type: "tm-load-plugin-library",
				paramObject: {url: url}
			});

			waitUntil(function() {
				return !!$tw.wiki.getTiddler(expectedTitle);
			},done,"tiddler " + expectedTitle);
		},10000);

		it("should still resolve via the legacy iframe.onload fallback when the child never sends PLUGIN-LIBRARY-READY", function(done) {
			if(!$tw.browser) { pending("browser-only: requires a real iframe - run in browser"); return; }

			// A blank document that never sends the handshake exercises the onload-only legacy path.
			var url = makeChildUrl("");

			$tw.rootWidget.dispatchEvent({
				type: "tm-load-plugin-library",
				paramObject: {url: url}
			});

			waitUntil(function() {
				var info = $tw.browserMessaging.iframeInfoMap[url];
				return !!info && info.status === "loaded";
			},done,"iframe status to become 'loaded' via onload");
		},10000);

		it("should complete the round trip via PLUGIN-LIBRARY-READY even when the child's own load is aborted and onload can never fire", function(done) {
			if(!$tw.browser) { pending("browser-only: requires a real iframe and postMessage - run in browser"); return; }

			// window.stop() simulates onload never firing despite the library being ready,
			// so only the PLUGIN-LIBRARY-READY message can complete this round trip.
			var url = makeChildUrl(
				"window.addEventListener('message',function(e){" +
                "if(e.data && e.data.verb === 'GET' && e.data.url === 'recipes/library/tiddlers.json'){" +
                "e.source.postMessage({verb:'GET-RESPONSE',status:'200',cookies:e.data.cookies,url:e.data.url," +
                "type:'application/json',body:JSON.stringify([{title:'ExamplePlugin',type:'application/json',text:'{}'}])},'*');" +
                "}});" +
                "window.parent.postMessage({verb:'PLUGIN-LIBRARY-READY'},'*');" +
                "window.stop();"
			);
			var expectedTitle = "$:/temp/RemoteAssetInfo/" + url + "/ExamplePlugin";

			$tw.rootWidget.dispatchEvent({
				type: "tm-load-plugin-library",
				paramObject: {url: url}
			});

			waitUntil(function() {
				return !!$tw.wiki.getTiddler(expectedTitle);
			},done,"tiddler " + expectedTitle);
		},10000);

	});

});