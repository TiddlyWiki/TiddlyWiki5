/*\
title: test-extlink-parser.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for the extlink wikitext parser rule.
URL validity is judged against RFC 1738 (https://datatracker.ietf.org/doc/html/rfc1738).

RFC 1738 character classes:
  safe       = "$" | "-" | "_" | "." | "+" | "!" | "*" | "'" | "(" | ")"  | ","
  reserved   = ";" | "/" | "?" | ":" | "@" | "=" | "&"
  unsafe     = " " | "<" | ">" | "#" | "%" | "{" | "}" | "|" | "\" | "^" | "~" | "[" | "]" | "`"
  escape     = "%" hex hex
  unreserved = alpha | digit | safe | extra
  uchar      = unreserved | escape
  xchar      = unreserved | reserved | escape

HTTP URL syntax:  http://<host>:<port>/<path>?<searchpart>
FTP URL syntax:   ftp://<user>:<password>@<host>:<port>/<cwd1>/.../<cwdN>/<name>;type=<typecode>
FILE URL syntax:  file://<host>/<path>
MAILTO URL syntax: mailto:<rfc822-addr-spec>

Note: RFC 1738 does not define https: or data: schemes (those came later).
The '#' character is explicitly unsafe per RFC 1738 — fragment identifiers
are not considered part of the URL.

\*/

"use strict";

describe("ExtLink parser tests", function() {

	var wiki = new $tw.Wiki();

	// Helper: parse wikitext and return the href of the first link found
	var getFirstLinkHref = function(text) {
		var tree = wiki.parseText("text/vnd.tiddlywiki", text).tree;
		// The extlink produces: p > a[href]
		if(tree[0] && tree[0].children) {
			for(var i = 0; i < tree[0].children.length; i++) {
				var node = tree[0].children[i];
				if(node.type === "element" && node.tag === "a" && node.attributes && node.attributes.href) {
					return node.attributes.href.value;
				}
			}
		}
		return null;
	};

	// =====================================================================
	// Basic valid URLs (RFC 1738 compliant)
	// =====================================================================

	it("should parse basic HTTP and HTTPS URLs", function() {
		// RFC 1738 §3.3: http://<host>:<port>/<path>?<searchpart>
		expect(getFirstLinkHref("https://www.tiddlywiki.com/")).toEqual("https://www.tiddlywiki.com/");
		expect(getFirstLinkHref("http://example.com/path")).toEqual("http://example.com/path");
	});

	it("should parse URL that is just protocol and domain", function() {
		expect(getFirstLinkHref("https://example.com")).toEqual("https://example.com");
	});

	it("should parse URLs with port numbers", function() {
		// RFC 1738 §3.3: port is optional, defaults to 80 for HTTP
		expect(getFirstLinkHref("https://localhost:8080/path")).toEqual("https://localhost:8080/path");
	});

	it("should parse other RFC 1738 schemes", function() {
		// RFC 1738 §3.2: FTP
		expect(getFirstLinkHref("ftp://files.example.com/pub/")).toEqual("ftp://files.example.com/pub/");
		// RFC 1738 §3.5: MAILTO
		expect(getFirstLinkHref("mailto:user@example.com")).toEqual("mailto:user@example.com");
		// RFC 1738 §3.10: FILE
		expect(getFirstLinkHref("file:///home/user/doc.txt")).toEqual("file:///home/user/doc.txt");
	});

	// =====================================================================
	// RFC 1738 safe characters: $ - _ . + ! * ' ( ) ,
	// These should all be valid within a URL path
	// =====================================================================

	it("should include safe characters in URL paths per RFC 1738", function() {
		// Parentheses are RFC 1738 safe characters
		expect(getFirstLinkHref("https://en.wikipedia.org/wiki/Specials_(Unicode_block)")).toEqual("https://en.wikipedia.org/wiki/Specials_(Unicode_block)");
		expect(getFirstLinkHref("https://example.com/wiki/A_(B)_C")).toEqual("https://example.com/wiki/A_(B)_C");
		// Plus sign is a safe character
		expect(getFirstLinkHref("https://example.com/search?q=hello+world")).toEqual("https://example.com/search?q=hello+world");
		// Exclamation mark is a safe character
		expect(getFirstLinkHref("https://example.com/path!/sub")).toEqual("https://example.com/path!/sub");
	});

	it("should handle deeply nested balanced parentheses", function() {
		// Parentheses are safe chars per RFC 1738; nesting should work
		expect(getFirstLinkHref("https://example.com/a(b(c(d)e)f)g")).toEqual("https://example.com/a(b(c(d)e)f)g");
	});

	it("should handle consecutive parenthesized segments", function() {
		expect(getFirstLinkHref("https://example.com/(a)(b)(c)")).toEqual("https://example.com/(a)(b)(c)");
	});

	// =====================================================================
	// RFC 1738 reserved characters: ; / ? : @ = &
	// Allowed unencoded when used for their reserved purpose
	// =====================================================================

	it("should include reserved characters used in query strings", function() {
		// RFC 1738 §3.3: <searchpart> uses reserved chars ? = &
		expect(getFirstLinkHref("https://example.com/path?foo=bar&baz=qux")).toEqual("https://example.com/path?foo=bar&baz=qux");
		expect(getFirstLinkHref("https://example.com?q=hello")).toEqual("https://example.com?q=hello");
	});

	it("should include reserved characters used for authentication", function() {
		// RFC 1738 §3.1: //<user>:<password>@<host>
		expect(getFirstLinkHref("https://user:password@example.com/path")).toEqual("https://user:password@example.com/path");
	});

	it("should include @ in path segments", function() {
		expect(getFirstLinkHref("https://example.com/@user/repo")).toEqual("https://example.com/@user/repo");
	});

	it("should include semicolons in URLs", function() {
		// RFC 1738 §3.2: FTP uses ;type=
		expect(getFirstLinkHref("https://example.com/path;param=val")).toEqual("https://example.com/path;param=val");
	});

	// =====================================================================
	// RFC 1738 unsafe characters: space < > " # % { } | \ ^ ~ [ ] `
	// The parser should exclude these from matched URLs
	// =====================================================================

	it("should stop at RFC 1738 unsafe characters", function() {
		// RFC 1738 §2.2: Characters that are unsafe for various reasons
		expect(getFirstLinkHref("https://example.com/path<rest")).toEqual("https://example.com/path");
		expect(getFirstLinkHref("https://example.com/path>rest")).toEqual("https://example.com/path");
		expect(getFirstLinkHref("https://example.com/path{rest")).toEqual("https://example.com/path");
		expect(getFirstLinkHref("https://example.com/path}rest")).toEqual("https://example.com/path");
		expect(getFirstLinkHref("https://example.com/path[rest")).toEqual("https://example.com/path");
		expect(getFirstLinkHref("https://example.com/path]rest")).toEqual("https://example.com/path");
		expect(getFirstLinkHref("https://example.com/path`rest")).toEqual("https://example.com/path");
		expect(getFirstLinkHref("https://example.com/path|rest")).toEqual("https://example.com/path");
		expect(getFirstLinkHref('https://example.com/path"rest')).toEqual("https://example.com/path");
		expect(getFirstLinkHref("https://example.com/path\\rest")).toEqual("https://example.com/path");
		expect(getFirstLinkHref("https://example.com/path^rest")).toEqual("https://example.com/path");
	});

	it("should stop at whitespace (space is unsafe per RFC 1738)", function() {
		expect(getFirstLinkHref("https://example.com/path rest")).toEqual("https://example.com/path");
		expect(getFirstLinkHref("https://example.com/path\nnext line")).toEqual("https://example.com/path");
	});

	it("should handle URL wrapped in unsafe delimiters", function() {
		// RFC 1738 §2.2: angle brackets and square brackets are unsafe
		// Tests that leading unsafe chars don't prevent URL matching
		expect(getFirstLinkHref("<https://example.com>")).toEqual("https://example.com");
		expect(getFirstLinkHref("[https://example.com]")).toEqual("https://example.com");
	});

	// =====================================================================
	// RFC 1738 escape sequences (%HH)
	// =====================================================================

	it("should include percent-encoded characters", function() {
		// RFC 1738 §2.2: unsafe chars should be encoded as %HH
		expect(getFirstLinkHref("https://example.com/path%20with%20spaces/file%2Fname")).toEqual("https://example.com/path%20with%20spaces/file%2Fname");
	});

	// =====================================================================
	// Fragment identifiers (#)
	// RFC 1738 says '#' is unsafe and fragments are NOT part of the URL.
	// However, the parser includes '#' in URLs (common modern practice).
	// =====================================================================

	it("should include # in URLs (deviates from RFC 1738 which says # is unsafe)", function() {
		// RFC 1738 §2.2: '#' is unsafe, fragment identifiers are not part of the URL
		// Parser behavior: includes # and everything after it as part of the URL
		expect(getFirstLinkHref("https://example.com#anchor")).toEqual("https://example.com#anchor");
	});

	it("should drop bare trailing # due to word boundary anchor", function() {
		// '#' is non-word, no word char follows, so regex (?:\/|\b) backtracks
		expect(getFirstLinkHref("https://example.com/#")).toEqual("https://example.com/");
	});

	it("should include # with query in reverse order (technically invalid per RFC 1738)", function() {
		expect(getFirstLinkHref("https://example.com/path#frag?query=1")).toEqual("https://example.com/path#frag?query=1");
	});

	// =====================================================================
	// Balanced parenthesis handling
	// The parser extends regex matches to consume balanced closing parens.
	// Parentheses are safe chars per RFC 1738, so they are valid in URLs.
	// =====================================================================

	it("should not include surrounding parentheses as part of the URL", function() {
		// Common prose pattern: (https://example.com) — parens belong to prose, not URL
		expect(getFirstLinkHref("(https://example.com)")).toEqual("https://example.com");
		expect(getFirstLinkHref("visit (https://example.com) for info")).toEqual("https://example.com");
	});

	it("should not consume unmatched trailing close-parens", function() {
		// URL has 1 open, text has 2 closes — only one should be consumed
		expect(getFirstLinkHref("https://example.com/wiki/A_(B))")).toEqual("https://example.com/wiki/A_(B)");
	});

	it("should not consume any close-paren when URL has no open-parens", function() {
		expect(getFirstLinkHref("https://example.com/path)")).toEqual("https://example.com/path");
	});

	it("should consume trailing close-paren to balance open-paren in URL", function() {
		expect(getFirstLinkHref("https://example.com/(open)")).toEqual("https://example.com/(open)");
	});

	it("should handle many trailing close-parens after balanced content", function() {
		// 2 opens, 5 closes: only 2 should be consumed by balanced-paren loop
		expect(getFirstLinkHref("https://example.com/a(b(c)d))))")).toEqual("https://example.com/a(b(c)d)");
	});

	it("should handle URL with mixed parentheses and query/fragment", function() {
		expect(getFirstLinkHref("https://example.com/wiki/A_(B)?action=edit#top")).toEqual("https://example.com/wiki/A_(B)?action=edit#top");
	});

	it("should handle URL with single open paren but no close paren", function() {
		// Open paren is a safe char per RFC 1738 — included as-is
		expect(getFirstLinkHref("https://example.com/path(open")).toEqual("https://example.com/path(open");
	});

	it("should handle URL surrounded by double parentheses", function() {
		var href = getFirstLinkHref("((https://example.com))");
		// Parser may or may not find the link depending on rule ordering
		expect(href === null || href === "https://example.com").toBe(true);
	});

	// =====================================================================
	// Regex word boundary anchor (?:\/|\b) edge cases
	// The regex requires URLs to end with '/' or at a word boundary.
	// This causes truncation when a URL ends with non-word characters
	// that aren't followed by word characters.
	// =====================================================================

	it("should not include empty parentheses due to word boundary anchor", function() {
		// '(' and ')' are non-word; regex backtracks to trailing '/'
		// RFC 1738: () are safe chars and should be valid, but the regex anchor prevents it
		expect(getFirstLinkHref("https://example.com/()")).toEqual("https://example.com/");
	});

	it("should truncate data URIs at trailing = due to word boundary anchor", function() {
		// '=' is a reserved char per RFC 1738 and should be valid in URLs.
		// The regex (?:\/|\b) anchor backtracks past '=' since it's non-word
		// followed by end-of-string (no word boundary).
		expect(getFirstLinkHref("data:text/plain;base64,SGVsbG8=")).toEqual("data:text/plain;base64,SGVsbG8");
	});

	it("should match bare protocol https:// (regex allows it since // ends with /)", function() {
		// RFC 1738 §3.3: HTTP requires <host>, so https:// is invalid per spec.
		// Parser matches it because '//' satisfies the (?:\/|\b) anchor.
		expect(getFirstLinkHref("https://")).toEqual("https://");
	});

	it("should handle URL ending with trailing period", function() {
		// '.' is a safe char per RFC 1738, valid in URLs
		// But trailing period at end of sentence is ambiguous
		var href = getFirstLinkHref("Visit https://example.com/path.");
		expect(href).not.toBeNull();
	});

	it("should handle URL ending with a comma", function() {
		// ',' is a safe char per RFC 1738, valid in URLs
		var href = getFirstLinkHref("See https://example.com/path, for details");
		expect(href).not.toBeNull();
	});

	// =====================================================================
	// Tilde (~) suppression
	// TiddlyWiki uses ~ prefix to suppress automatic linking.
	// Note: ~ is an unsafe char per RFC 1738.
	// =====================================================================

	it("should suppress links preceded by ~", function() {
		expect(getFirstLinkHref("~https://example.com")).toEqual(null);
	});

	it("should suppress link with ~ even if URL has parens", function() {
		expect(getFirstLinkHref("~https://en.wikipedia.org/wiki/Specials_(Unicode_block)")).toEqual(null);
	});

	it("should handle adjacent suppressed and real links", function() {
		// First URL is suppressed with ~, second should be found
		expect(getFirstLinkHref("~https://suppressed.com https://real.com")).toEqual("https://real.com");
	});

	it("should handle tilde in URL path (not at start — no suppression)", function() {
		// ~ in the path is not a suppression prefix
		// RFC 1738: ~ is unsafe, but commonly used in practice for user dirs
		expect(getFirstLinkHref("https://example.com/~user/page")).toEqual("https://example.com/~user/page");
	});

	// =====================================================================
	// Miscellaneous edge cases
	// =====================================================================

	it("should handle multiple URLs in the same text (first link returned)", function() {
		expect(getFirstLinkHref("See https://first.com and https://second.com")).toEqual("https://first.com");
	});

	it("should handle very long URLs", function() {
		var longPath = "";
		for(var i = 0; i < 200; i++) { longPath += "/seg" + i; }
		var longUrl = "https://example.com" + longPath;
		expect(getFirstLinkHref(longUrl)).toEqual(longUrl);
	});

	it("should handle URL with double slashes in path", function() {
		expect(getFirstLinkHref("https://example.com//double//slash")).toEqual("https://example.com//double//slash");
	});

	it("should handle URL with unicode path segments", function() {
		// RFC 1738 §2.2: non-ASCII chars should be encoded, but parser accepts them
		expect(getFirstLinkHref("https://example.com/日本語/page")).toEqual("https://example.com/日本語/page");
	});

});
