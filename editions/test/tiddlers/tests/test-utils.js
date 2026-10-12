/*\
title: test-utils.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests various utility functions.

\*/

"use strict";

describe("Utility tests", function() {

	it("should handle parsing a string array", function() {
		var psa = $tw.utils.parseStringArray;
		expect(psa("Tiddler8")).toEqual(["Tiddler8"]);
		expect(psa(" Tiddler8")).toEqual(["Tiddler8"]);
		expect(psa("Tiddler8 ")).toEqual(["Tiddler8"]);
		expect(psa("Tiddler8 two")).toEqual(["Tiddler8","two"]);
		expect(psa(" Tiddler8 two ")).toEqual(["Tiddler8","two"]);
		expect(psa(" Tidd\u00a0ler8 two ")).toEqual(["Tidd\u00a0ler8","two"]);
		expect(psa(" [[Tidd\u00a0ler8]] two ")).toEqual(["Tidd\u00a0ler8","two"]);
	});

	it("should handle base64 encoding emojis", function() {
		var booksEmoji = "📚";
		expect(booksEmoji).toBe(booksEmoji);
		// 📚 is U+1F4DA BOOKS, which is represented by surrogate pair 0xD83D 0xDCDA in Javascript
		expect(booksEmoji.length).toBe(2);
		expect(booksEmoji.charCodeAt(0)).toBe(55357); // 0xD83D
		expect(booksEmoji.charCodeAt(1)).toBe(56538); // 0xDCDA
		expect($tw.utils.base64Encode(booksEmoji)).not.toBe("7aC97bOa", "if base64 is 7aC97bOa then surrogate pairs were incorrectly treated as codepoints");
		expect($tw.utils.base64Encode(booksEmoji)).toBe("8J+Tmg==", "if surrogate pairs are correctly treated as a single code unit then base64 should be 8J+Tmg==");
		expect($tw.utils.base64Decode("8J+Tmg==")).toBe(booksEmoji);
		expect($tw.utils.base64Decode($tw.utils.base64Encode(booksEmoji))).toBe(booksEmoji, "should round-trip correctly");
	});

	it("should handle base64 encoding emojis in URL-safe variant", function() {
		var booksEmoji = "📚";
		expect($tw.utils.base64Encode(booksEmoji, false, true)).toBe("8J-Tmg==", "if surrogate pairs are correctly treated as a single code unit then base64 should be 8J+Tmg==");
		expect($tw.utils.base64Decode("8J-Tmg==", false, true)).toBe(booksEmoji);
		expect($tw.utils.base64Decode($tw.utils.base64Encode(booksEmoji, false, true), false, true)).toBe(booksEmoji, "should round-trip correctly");
	});

	it("should handle base64 encoding binary data", function() {
		var binaryData = "\xff\xfe\xfe\xff";
		var encoded = $tw.utils.base64Encode(binaryData,true);
		expect(encoded).toBe("//7+/w==");
		var decoded = $tw.utils.base64Decode(encoded,true);
		expect(decoded).toBe(binaryData, "Binary data did not round-trip correctly");
	});

	it("should handle base64 encoding binary data in URL-safe variant", function() {
		var binaryData = "\xff\xfe\xfe\xff";
		var encoded = $tw.utils.base64Encode(binaryData,true,true);
		expect(encoded).toBe("__7-_w==");
		var decoded = $tw.utils.base64Decode(encoded,true,true);
		expect(decoded).toBe(binaryData, "Binary data did not round-trip correctly");
	});

	it("should handle stringifying a string array", function() {
		var str = $tw.utils.stringifyList;
		expect(str([])).toEqual("");
		expect(str(["Tiddler8"])).toEqual("Tiddler8");
		expect(str(["Tiddler8  "])).toEqual("[[Tiddler8  ]]");
		expect(str(["A+B", "A-B", "A=B"])).toEqual("A+B A-B A=B");
		expect(str(["A B"])).toEqual("[[A B]]");
		// Starting special characters aren't treated specially,
		// even though this makes a list incompatible with a filter parser.
		expect(str(["+T", "-T", "~T", "=T", "$T"])).toEqual("+T -T ~T =T $T");
		expect(str(["A", "", "B"])).toEqual("A  B");
	});

	it("stringifyList shouldn't interfere with setting variables to negative numbers", function() {
		var wiki = $tw.test.wiki();
		wiki.addTiddler({title: "test", text: "<$set name=X filter='\"-7\"'>{{{ [<X>add[2]] }}}</$set>"});
		// X shouldn't be wrapped in brackets. If it is, math filters will treat it as zero.
		expect(wiki.renderTiddler("text/plain","test")).toBe("-5");
	});

	it("should parse text references", function() {
		var ptr = $tw.utils.parseTextReference;
		expect(ptr("title")).toEqual(
			{ title : "title" }
		);
		expect(ptr("ti#tle")).toEqual(
			{ title : "ti#tle" }
		);
		expect(ptr("ti!tle")).toEqual(
			{ title : "ti!tle" }
		);
		expect(ptr("ti#tle##index")).toEqual(
			{ title : "ti#tle", index : "index" }
		);
		expect(ptr("ti!tle!!field")).toEqual(
			{ title : "ti!tle", field : "field" }
		);
		expect(ptr("title##index!!field")).toEqual(
			{ title : "title##index", field : "field" }
		);
		expect(ptr("title!!field##index")).toEqual(
			{ title : "title", field : "field##index" }
		);

	});

	it("should compare versions", function() {
		var cv = $tw.utils.compareVersions;
		expect(cv("v0.0.0","v0.0.0")).toEqual(0);
		expect(cv("0.0.0","v0.0.0")).toEqual(0);
		expect(cv("v0.0.0","0.0.0")).toEqual(0);
		expect(cv("v0.0.0","not a version")).toEqual(0);
		expect(cv("v0.0.0",undefined)).toEqual(0);
		expect(cv("not a version","v0.0.0")).toEqual(0);
		expect(cv(undefined,"v0.0.0")).toEqual(0);
		expect(cv("v1.0.0","v1.0.0")).toEqual(0);
		expect(cv("v1.0.0","1.0.0")).toEqual(0);

		expect(cv("v1.0.1",undefined)).toEqual(+1);
		expect(cv("v1.0.1","v1.0.0")).toEqual(+1);
		expect(cv("v1.1.1","v1.1.0")).toEqual(+1);
		expect(cv("v1.1.2","v1.1.1")).toEqual(+1);
		expect(cv("1.1.2","v1.1.1")).toEqual(+1);

		expect(cv("v1.0.0","v1.0.1")).toEqual(-1);
		expect(cv("v1.1.0","v1.1.1")).toEqual(-1);
		expect(cv("v1.1.1","v1.1.2")).toEqual(-1);
		expect(cv("1.1.1","1.1.2")).toEqual(-1);
	});

	it("should insert strings into sorted arrays", function() {
		expect($tw.utils.insertSortedArray([],"a").join(",")).toEqual("a");
		expect($tw.utils.insertSortedArray(["b","c","d"],"a").join(",")).toEqual("a,b,c,d");
		expect($tw.utils.insertSortedArray(["b","c","d"],"d").join(",")).toEqual("b,c,d");
		expect($tw.utils.insertSortedArray(["b","c","d"],"f").join(",")).toEqual("b,c,d,f");
		expect($tw.utils.insertSortedArray(["b","c","d","e"],"f").join(",")).toEqual("b,c,d,e,f");
		expect($tw.utils.insertSortedArray(["b","c","g"],"f").join(",")).toEqual("b,c,f,g");
		expect($tw.utils.insertSortedArray(["b","c","d"],"ccc").join(",")).toEqual("b,c,ccc,d");
	});

});
