/*\
title: test-basic-authenticator.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for $:/core/modules/server/authenticators/basic.js. This is node-only
(module-type authenticator), so it runs under `npm test` and is absent in the
browser.

\*/
"use strict";

if($tw.node) {

	var BasicAuthenticator = $tw.modules.execute("$:/core/modules/server/authenticators/basic.js").AuthenticatorClass;

	describe("BasicAuthenticator", function() {

		function makeAuthenticator() {
			var authenticator = new BasicAuthenticator({
				get: function(name) { return undefined; },
				boot: $tw.boot
			});
			authenticator.init();
			return authenticator;
		}

		function makeRequest(authorization,encrypted) {
			var headers = {};
			if(authorization !== undefined) {
				headers.authorization = authorization;
			}
			return {
				headers: headers,
				socket: {encrypted: encrypted}
			};
		}

		function makeResponse() {
			return {
				writeHead: function() {},
				end: function() {}
			};
		}

		function basicHeader(username,password) {
			return "Basic " + $tw.utils.base64Encode(username + ":" + password);
		}

		it("does not warn for Basic Authentication over an encrypted (HTTPS) connection", function() {
			var authenticator = makeAuthenticator(),
				request = makeRequest(basicHeader("user","pass"),true),
				response = makeResponse();
			spyOn(console,"log");
			var result = authenticator.authenticateRequest(request,response,{server: authenticator.server});
			expect(console.log).not.toHaveBeenCalled();
			// No credentials are configured, so the request falls through to the 401 challenge rather than being blocked outright
			expect(result).toBe(false);
		});

		it("warns but still authenticates for Basic Authentication over an unencrypted (HTTP) connection", function() {
			var authenticator = makeAuthenticator(),
				request = makeRequest(basicHeader("user","pass"),false),
				response = makeResponse();
			spyOn(console,"log");
			var result = authenticator.authenticateRequest(request,response,{server: authenticator.server});
			expect(console.log).toHaveBeenCalled();
			expect(console.log.calls.mostRecent().args[0]).toContain("Basic Authentication");
			// Still falls through to the 401 challenge (unauthenticated credentials), not blocked with a 400
			expect(result).toBe(false);
		});

		it("does not warn for a plain HTTP request with no Basic Authentication header", function() {
			var authenticator = makeAuthenticator(),
				request = makeRequest(undefined,false),
				response = makeResponse();
			spyOn(console,"log");
			var result = authenticator.authenticateRequest(request,response,{server: authenticator.server,allowAnon: true});
			expect(console.log).not.toHaveBeenCalled();
			expect(result).toBe(true);
		});

	});

}
