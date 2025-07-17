/*\
title: test-filters.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the filtering mechanism.

\*/

	"use strict";
	
	describe("Filter tests", function() {
	
		// Test filter parsing
		it("should parse new-style rich operator suffixes", function() {
			expect($tw.wiki.parseFilter("[search:: four, , five,, six [operand]]")).toEqual(
				[ { prefix : '', operators : [ { operator : 'search', suffix : ': four, , five,, six ', suffixes : [ [  ], [ 'four', 'five', 'six' ] ], operands: [ { text:'operand' } ] } ] } ]
			);
			expect($tw.wiki.parseFilter("[search: one, two ,three :[operand]]")).toEqual(
				[ { prefix : '', operators : [ { operator : 'search', suffix : ' one, two ,three :', suffixes : [ [ 'one', 'two', 'three' ], [  ] ], operands: [ { text:'operand' } ] } ] } ]
			);
			expect($tw.wiki.parseFilter("[search: one, two ,three :[operand]]")).toEqual(
				[ { prefix : '', operators : [ { operator : 'search', suffix : ' one, two ,three :', suffixes : [ [ 'one', 'two', 'three' ], [  ] ], operands: [ { text:'operand' } ] } ] } ]
			);
			expect($tw.wiki.parseFilter("[search: one, two ,three : four, , five,, six [operand]]")).toEqual(
				[ { prefix : '', operators : [ { operator : 'search', suffix : ' one, two ,three : four, , five,, six ', suffixes : [ [ 'one', 'two', 'three' ], [ 'four', 'five', 'six' ] ], operands: [ { text:'operand' } ] } ] } ]
			);
			expect($tw.wiki.parseFilter("[search: , : [operand]]")).toEqual(
				[ { prefix : '', operators : [ { operator : 'search', suffix : ' , : ', suffixes : [ [  ], [  ] ], operands: [ { text:'operand' } ] } ] } ]
			);
		});
		
		
		it("should parse multiple operands for operators", function() {
			expect($tw.wiki.parseFilter("[search: , : [operand],[operand2]]")).toEqual(
				[ { prefix : '', operators : [ { operator : 'search', suffix : ' , : ', suffixes : [ [  ], [  ] ], operands: [ { text:'operand' }, { text:'operand2' } ] } ] } ]
			);
			expect($tw.wiki.parseFilter("[search: , : [oper,and],[operand2]]")).toEqual(
				[ { prefix : '', operators : [ { operator : 'search', suffix : ' , : ', suffixes : [ [  ], [  ] ], operands: [ { text:'oper,and' }, { text:'operand2' } ] } ] } ]
			);
			expect($tw.wiki.parseFilter("[[GettingStarted]replace:[operand],[operand2]]")).toEqual(
				[ { prefix : '', operators : [ { operator : 'title', operands: [ { text:'GettingStarted' } ] },  { operator : 'replace', suffix : '', suffixes : [[]], operands: [ { text:'operand' }, { text:'operand2' }  ] } ] } ]
			);
			expect($tw.wiki.parseFilter("[[GettingStarted]replace[operand],[operand2]split[-]]")).toEqual(
				[ { prefix : '', operators : [ { operator : 'title', operands: [{ text:'GettingStarted' }] },  { operator : 'replace', operands: [{ text:'operand' }, { text:'operand2' }] }, { operator : 'split', operands: [ { text:'-' } ] } ] } ]
			);
			expect($tw.wiki.parseFilter("[[GettingStarted]replace[operand],[operand2]split[-]split2[a],[b]]")).toEqual(
				[ { prefix : '', operators : [ { operator : 'title', operands: [{ text:'GettingStarted' }] },  { operator : 'replace',  operands: [ { text:'operand' }, { text:'operand2' } ] }, { operator : 'split', operands: [ {text:'-'} ] }, { operator : 'split2', operands: [ { text:'a' }, { text: 'b' }] } ] } ]
			);
			expect($tw.wiki.parseFilter("[[GettingStarted]replace[operand],[operand2]split[-]split2[a],<b>,{c}]")).toEqual(
				[ { prefix : '', operators : [ { operator : 'title', operands: [{ text:'GettingStarted' }] },  { operator : 'replace',  operands: [ { text:'operand' }, { text:'operand2' } ] }, { operator : 'split', operands: [ {text:'-'} ] }, { operator : 'split2', operands: [ { text:'a' }, { variable: true, text: 'b' }, { indirect: true, text: 'c' }] } ] } ]
			);
		});
	
		describe("With tiddlers in the store unsorted",function() {
			testWithAndWithoutIndexers();
		});
		describe("With tiddlers in the store sorted ascending",function() {
			testWithAndWithoutIndexers({sort: "ascending"});
		});
		describe("With tiddlers in the store sorted descending",function() {
			testWithAndWithoutIndexers({sort: "descending"});
		});

	function testWithAndWithoutIndexers(options) {
		describe("With no indexers", function() {
			var wiki = setupWiki(Object.assign({},options,{enableIndexers: []}));
			it("should not create indexes when requested not to",function() {
				expect(wiki.getIndexer("FieldIndexer")).toBe(null);
			});
			runTests(wiki);
		});
	
		describe("With all indexers", function() {
			var wiki = setupWiki(options);
			if(wiki.getIndexer("FieldIndexer")) {
				wiki.getIndexer("FieldIndexer").setMaxIndexedValueLength(8); // Note that JoeBloggs is 9, and John is 5
			}
			runTests(wiki);
		});
	}
	
	function setupWiki(wikiOptions) {
		wikiOptions = wikiOptions || {};
		// Create a wiki
		var wiki = new $tw.Wiki(wikiOptions);
		// Add a plugin containing some shadow tiddlers
		var shadowTiddlers = {
			tiddlers: {
				"$:/TiddlerFive": {
					title: "$:/TiddlerFive",
					text: "Everything in federation",
					tags: ["two"]
				},
				"TiddlerSix": {
					title: "TiddlerSix",
					text: "Missing inaction from [[TiddlerOne]]",
					filter: "[[one]] [[a a]] [subfilter{hasList!!list}]",
					tags: []
				},
				"TiddlerSeventh": {
					title: "TiddlerSeventh",
					text: "",
					list: "[[TiddlerOne]] [[Tiddler Three]] [[a fourth tiddler]] [[MissingTiddler]]",
					tags: ["one"]
				},
				"Tiddler8": {
					title: "Tiddler8",
					text: "Tidd",
					tags: ["one"],
					"test-field": "JoeBloggs"
				}
			}
		};
		var tiddlers = [{
			title: "$:/ShadowPlugin",
			text: JSON.stringify(shadowTiddlers),
			"plugin-type": "plugin",
			type: "application/json"
		},{
			title: "TiddlerOne",
			text: "The quick brown fox in $:/TiddlerTwo",
			tags: ["one"],
			cost: "123",
			value: "120",
			slug: "tiddler-one",
			authors: "Joe Bloggs",
			modifier: "JoeBloggs",
			modified: "201304152222"
		},{
			title: "$:/TiddlerTwo",
			text: "The rain in Spain\nfalls mainly on the plain and [[a fourth tiddler]]",
			tags: ["two"],
			cost: "42",
			value: "190",
			slug: "tiddler-two",
			authors: "[[John Doe]]",
			modifier: "John",
			modified: "201304152211"
		},{
			title: "Tiddler Three",
			text: "The speed of sound in light\n\nThere is no [[TiddlerZero]] but [[TiddlerSix]]",
			tags: ["one","two"],
			cost: "56",
			value: "80",
			modifier: "John",
			modified: "201304162202"
		},{
			title: "a fourth tiddler",
			text: "The quality of mercy is not drained by [[Tiddler Three]]",
			tags: [],
			cost: "82",
			value: "72",
			empty: "not",
			modifier: "John"
		},{
			title: "one",
			text: "This is the text of tiddler [[one]]",
			list: "[[Tiddler Three]] [[TiddlerOne]]",
			empty: "",
			modifier: "John"
		},{
			title: "hasList",
			text: "This is the text of tiddler [[hasList]]",
			list: "[[Tiddler Three]] [[TiddlerOne]]",
			modifier: "PMario"
		},{
			title: "has filter",
			text: "This is the text of tiddler [[has filter]]",
			filter: "[[Tiddler Three]] [[TiddlerOne]] [subfilter{hasList!!list}]",
			modifier: "PMario"
		},{
			title: "filter regexp test",
			text: "Those strings have been used to create the `regexp = /[+|\-|~]?([[](?:[^\]])*\]+)|([+|-|~|\S]\S*)/;`",
			filter: "+aaa -bbb ~ccc aaaaaabbbbbbbbaa \"bb'b\" 'cc\"c' [[abc]] [[tiddler with spaces]] [is[test]] [is[te st]] a s df [enlist<hugo>] +[enlist:raw{test with spaces}] [enlist:raw{test with spaces}] [[a a]] [[ ] [ ]] [[ [hugo]] [subfilter{Story/Tower of Hanoi/A-C Sequence}]",
			modifier: "PMario"
		}];
		// Load the tiddlers in the required order
		var fnCompare;
		switch(wikiOptions.sort) {
			case "ascending":
				fnCompare = function(a,b) {
					if(a.title < b.title) {
						return -1;
					} else if(a.title > b.title) {
						return +1;
					} else {
						return 0;
					}
				};
				break;
			case "descending":
				fnCompare = function(a,b) {
					if(a.title < b.title) {
						return +1;
					} else if(a.title > b.title) {
						return -1;
					} else {
						return 0;
					}
				};
				break;
		}
		if(fnCompare) {
			tiddlers.sort(fnCompare);
		}
		wiki.addTiddlers(tiddlers);
		// Unpack plugin tiddlers
		wiki.readPluginInfo();
		wiki.registerPluginTiddlers("plugin");
		wiki.unpackPluginTiddlers();
		wiki.addIndexersToWiki();
		return wiki;
	}
	
	// Our tests
	function runTests(wiki) {
	
		it("should handle the enlist operator", function() {
			expect(wiki.filterTiddlers("[enlist[one two three]addsuffix[!]]").join(",")).toBe("one!,two!,three!");
		});
		
		it("should handle the enlist-input operator", function() {
			expect(wiki.filterTiddlers("[[one two three]enlist-input[]]").join(",")).toBe("one,two,three");
			expect(wiki.filterTiddlers("[[one two two three]enlist-input[]]").join(",")).toBe("one,two,three");
			expect(wiki.filterTiddlers("[[one two two three]enlist-input:dedupe[]]").join(",")).toBe("one,two,three");
			expect(wiki.filterTiddlers("[[one two two three]enlist-input:raw[]]").join(",")).toBe("one,two,two,three");
			expect(wiki.filterTiddlers("[[one two three]] [[four five six]] +[enlist-input[]]").join(",")).toBe("one,two,three,four,five,six");
			expect(wiki.filterTiddlers("[[one two three]] [[four five six]] [[seven eight]] +[enlist-input[]]").join(",")).toBe("one,two,three,four,five,six,seven,eight");
			expect(wiki.filterTiddlers("[[]] +[enlist-input[]]").join(",")).toBe("");
		});
		
		it("should handle the then and else operators", function() {
			expect(wiki.filterTiddlers("[modifier[JoeBloggs]then[Susi]]").join(",")).toBe("Susi");
			expect(wiki.filterTiddlers("[!modifier[JoeBloggs]then[Susi]]").join(",")).toBe("Susi,Susi,Susi,Susi,Susi,Susi,Susi,Susi");
			expect(wiki.filterTiddlers("[modifier[DaveBloggs]then[Susi]]").join(",")).toBe("");
			expect(wiki.filterTiddlers("[modifier[JoeBloggs]else[Susi]]").join(",")).toBe("TiddlerOne");
			expect(wiki.filterTiddlers("[!modifier[JoeBloggs]else[Susi]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,filter regexp test,has filter,hasList,one,Tiddler Three");
			expect(wiki.filterTiddlers("[modifier[DaveBloggs]else[Susi]]").join(",")).toBe("Susi");
		});
	
		it("should handle the ~ prefix", function() {
			expect(wiki.filterTiddlers("[modifier[JoeBloggs]] ~[[No such tiddler]]").join(",")).toBe("TiddlerOne");
			expect(wiki.filterTiddlers("[modifier[Susi]] ~[[No such tiddler]]").join(",")).toBe("No such tiddler");
			expect(wiki.filterTiddlers("~[[No such tiddler]]").join(",")).toBe("No such tiddler");
			expect(wiki.filterTiddlers("[my-field[present]] ~[[No such tiddler]]").join(",")).toBe("No such tiddler");
		});
	
		it("should handle the lookup operator", function() {
			expect(wiki.filterTiddlers("Six Seventh 8 +[lookup[Tiddler]]").join(",")).toBe("Missing inaction from [[TiddlerOne]],,Tidd");
			expect(wiki.filterTiddlers("Six Seventh 8 +[lookup:8[Tiddler]]").join(",")).toBe("Missing inaction from [[TiddlerOne]],8,Tidd");
			expect(wiki.filterTiddlers("Six Seventh 8 +[lookup:8[Tiddler],[text]]").join(",")).toBe("Missing inaction from [[TiddlerOne]],8,Tidd");
			expect(wiki.filterTiddlers("Six Seventh 8 +[lookup[Tiddler],[tags]]").join(",")).toBe(",one,one");
		});
	
		it("should retrieve shadow tiddlers", function() {
			expect(wiki.getTiddlerText("Tiddler8")).toBe("Tidd");
		});
	
		it("should handle the title operator", function() {
			expect(wiki.filterTiddlers("TiddlerOne [title[$:/TiddlerTwo]] [[Tiddler Three]]").join(",")).toBe("TiddlerOne,$:/TiddlerTwo,Tiddler Three");
			expect(wiki.filterTiddlers("[!title[Tiddler Three]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,filter regexp test,has filter,hasList,one,TiddlerOne");
			expect(wiki.filterTiddlers("TiddlerOne [title[$:/TiddlerTwo]] [[Tiddler Three]] [[A Missing Tiddler]]").join(",")).toBe("TiddlerOne,$:/TiddlerTwo,Tiddler Three,A Missing Tiddler");
		});
	
		it("should handle the field operator", function() {
			expect(wiki.filterTiddlers("[modifier[JoeBloggs]]").join(",")).toBe("TiddlerOne");
			expect(wiki.filterTiddlers("[!modifier[JoeBloggs]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,filter regexp test,has filter,hasList,one,Tiddler Three");
			expect(wiki.filterTiddlers("[!is[system]!modifier[JoeBloggs]]").join(",")).toBe("a fourth tiddler,filter regexp test,has filter,hasList,one,Tiddler Three");
			expect(wiki.filterTiddlers("[field:modifier[JoeBloggs]]").join(",")).toBe("TiddlerOne");
			expect(wiki.filterTiddlers("[!field:modifier[JoeBloggs]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,filter regexp test,has filter,hasList,one,Tiddler Three");
			expect(wiki.filterTiddlers("[!is[system]!field:modifier[JoeBloggs]]").join(",")).toBe("a fourth tiddler,filter regexp test,has filter,hasList,one,Tiddler Three");
			expect(wiki.filterTiddlers("[modifier[John]]").join(",")).toBe("$:/TiddlerTwo,a fourth tiddler,one,Tiddler Three");
			expect(wiki.filterTiddlers("[!modifier[John]]").join(",")).toBe("$:/ShadowPlugin,filter regexp test,has filter,hasList,TiddlerOne");
			expect(wiki.filterTiddlers("[!is[system]!modifier[John]]").join(",")).toBe("filter regexp test,has filter,hasList,TiddlerOne");
			expect(wiki.filterTiddlers("[field:modifier[John]]").join(",")).toBe("$:/TiddlerTwo,a fourth tiddler,one,Tiddler Three");
			expect(wiki.filterTiddlers("[!field:modifier[John]]").join(",")).toBe("$:/ShadowPlugin,filter regexp test,has filter,hasList,TiddlerOne");
			expect(wiki.filterTiddlers("[!is[system]!field:modifier[John]]").join(",")).toBe("filter regexp test,has filter,hasList,TiddlerOne");
		});
	
		it("should handle the regexp operator", function() {
			expect(wiki.filterTiddlers("[regexp[id]]").join(",")).toBe("$:/TiddlerTwo,a fourth tiddler,Tiddler Three,TiddlerOne");
			expect(wiki.filterTiddlers("[!regexp[id]]").join(",")).toBe("$:/ShadowPlugin,filter regexp test,has filter,hasList,one");
			expect(wiki.filterTiddlers("[regexp[Tid]]").join(",")).toBe("$:/TiddlerTwo,Tiddler Three,TiddlerOne");
			expect(wiki.filterTiddlers("[regexp[(?i)Tid]]").join(",")).toBe("$:/TiddlerTwo,a fourth tiddler,Tiddler Three,TiddlerOne");
			expect(wiki.filterTiddlers("[!regexp[Tid(?i)]]").join(",")).toBe("$:/ShadowPlugin,filter regexp test,has filter,hasList,one");
		});
	
		// The following 2 tests should write a log -> WARNING: Filter modifier has a deprecated regexp operand XXXX
		// The test should pass anyway.
		it("should handle the field operator with a regular expression operand", function() {
			spyOn(console, 'log');
			expect(wiki.filterTiddlers("[modifier/JoeBloggs/]").join(",")).toBe("TiddlerOne");
			expect(console.log).toHaveBeenCalledWith("WARNING: Filter", "modifier", "has a deprecated regexp operand", /JoeBloggs/);
			console.log.calls.reset();
			expect(wiki.filterTiddlers("[modifier/Jo/]").join(",")).toBe("$:/TiddlerTwo,a fourth tiddler,one,Tiddler Three,TiddlerOne");
			expect(console.log).toHaveBeenCalledWith("WARNING: Filter", "modifier", "has a deprecated regexp operand", /Jo/);
		});

		it("should handle regular expression operands without crashing", function() {
			spyOn(console, 'log');
			// We don't really care about the results. Just don't get RSoD.
			expect(() => wiki.filterTiddlers("[all/current/]")).not.toThrow();
			expect(() => wiki.filterTiddlers("[prefix/anything/]")).not.toThrow();
			expect(() => wiki.filterTiddlers("[title/anything/]")).not.toThrow();
			expect(() => wiki.filterTiddlers("[/anything/]")).not.toThrow();
			expect(() => wiki.filterTiddlers("[//]")).not.toThrow();
		});
	
		it("should handle the prefix operator", function() {
			expect(wiki.filterTiddlers("[prefix[Tiddler]]").join(",")).toBe("Tiddler Three,TiddlerOne");
			expect(wiki.filterTiddlers("[prefix:casesensitive[tiddler]]").join(",")).toBe("");
			expect(wiki.filterTiddlers("[prefix:caseinsensitive[tiddler]]").join(",")).toBe("Tiddler Three,TiddlerOne");
			expect(wiki.filterTiddlers("[prefix[nothing]]").join(",")).toBe("");
			expect(wiki.filterTiddlers("[enlist[ABCDE abcde]prefix[]]").join(",")).toBe("ABCDE,abcde");
		});

		it("should handle the suffix operator", function() {
			expect(wiki.filterTiddlers("[suffix[One]]").join(",")).toBe("TiddlerOne");
			expect(wiki.filterTiddlers("[suffix:casesensitive[one]]").join(",")).toBe("one");
			expect(wiki.filterTiddlers("[suffix:caseinsensitive[one]]").join(",")).toBe("one,TiddlerOne");
			expect(wiki.filterTiddlers("[suffix[nothing]]").join(",")).toBe("");
			expect(wiki.filterTiddlers("[enlist[ABCDE abcde]suffix[]]").join(",")).toBe("ABCDE,abcde");
		});

		it("should handle the removeprefix operator", function() {
			expect(wiki.filterTiddlers("[enlist[ABCDE abcde]removeprefix[ABC]]").join(",")).toBe("DE");
			expect(wiki.filterTiddlers("[enlist[ABCDE abcde]removeprefix:casesensitive[ABC]]").join(",")).toBe("DE");
			expect(wiki.filterTiddlers("[enlist[ABCDE abcde]removeprefix:caseinsensitive[abc]]").join(",")).toBe("DE,de");
			expect(wiki.filterTiddlers("[enlist[ABCDE abcde]removeprefix[]]").join(",")).toBe("ABCDE,abcde");
		});

		it("should handle the removesuffix operator", function() {
			expect(wiki.filterTiddlers("[enlist[ABCDE abcde]removesuffix[DE]]").join(",")).toBe("ABC");
			expect(wiki.filterTiddlers("[enlist[ABCDE abcde]removesuffix:casesensitive[DE]]").join(",")).toBe("ABC");
			expect(wiki.filterTiddlers("[enlist[ABCDE abcde]removesuffix:caseinsensitive[de]]").join(",")).toBe("ABC,abc")
			expect(wiki.filterTiddlers("[enlist[ABCDE abcde]removesuffix[]]").join(",")).toBe("ABCDE,abcde");
		});
	
		it("should handle the sort and sortcs operators", function() {
			expect(wiki.filterTiddlers("[sort[title]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,filter regexp test,has filter,hasList,one,Tiddler Three,TiddlerOne");
			expect(wiki.filterTiddlers("[!sort[title]]").join(",")).toBe("TiddlerOne,Tiddler Three,one,hasList,has filter,filter regexp test,a fourth tiddler,$:/TiddlerTwo,$:/ShadowPlugin");
			expect(wiki.filterTiddlers("[sort[modified]]").join(",")).toBe("$:/ShadowPlugin,a fourth tiddler,filter regexp test,has filter,hasList,one,$:/TiddlerTwo,TiddlerOne,Tiddler Three");
			expect(wiki.filterTiddlers("[!sort[modified]]").join(",")).toBe("Tiddler Three,TiddlerOne,$:/TiddlerTwo,$:/ShadowPlugin,a fourth tiddler,filter regexp test,has filter,hasList,one");
			// Temporarily commenting out the following two lines because of platform differences for localeCompare between the browser and Node.js
			// expect(wiki.filterTiddlers("[sortcs[title]]").join(",")).toBe("$:/TiddlerTwo,Tiddler Three,TiddlerOne,a fourth tiddler,one");
			// expect(wiki.filterTiddlers("[!sortcs[title]]").join(",")).toBe("one,a fourth tiddler,TiddlerOne,Tiddler Three,$:/TiddlerTwo");
		});
	
		it("should handle the nsort and nsortcs operators", function() {
			expect(wiki.filterTiddlers("3 2 0 1 5 Apple add Beta beatle +[nsort[]]").join(",")).toBe("0,1,2,3,5,add,Apple,beatle,Beta");
			expect(wiki.filterTiddlers("3 2 0 1 5 Apple add Beta beatle +[!nsort[]]").join(",")).toBe("Beta,beatle,Apple,add,5,3,2,1,0");
			expect(wiki.filterTiddlers("3 2 0 1 5 Apple add Beta beatle +[nsortcs[]]").join(",")).toBe("0,1,2,3,5,add,Apple,beatle,Beta");
			expect(wiki.filterTiddlers("3 2 0 1 5 Apple add Beta beatle +[!nsortcs[]]").join(",")).toBe("Beta,beatle,Apple,add,5,3,2,1,0");
		});
	
		it("should handle the reverse, first, last, butfirst, butlast, rest and nth operators", function() {
			expect(wiki.filterTiddlers("[sort[title]first[]]").join(",")).toBe("$:/ShadowPlugin");
			expect(wiki.filterTiddlers("[sort[title]first[2]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo");
			expect(wiki.filterTiddlers("[sort[title]first[8]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,filter regexp test,has filter,hasList,one,Tiddler Three");
			expect(wiki.filterTiddlers("[sort[title]first[x]]").join(",")).toBe("$:/ShadowPlugin");
			expect(wiki.filterTiddlers("[sort[title]last[]]").join(",")).toBe("TiddlerOne");
			expect(wiki.filterTiddlers("[sort[title]last[0]]").join(",")).toBe("");
			expect(wiki.filterTiddlers("[sort[title]last[2]]").join(",")).toBe("Tiddler Three,TiddlerOne");
			expect(wiki.filterTiddlers("[sort[title]last[8]]").join(",")).toBe("$:/TiddlerTwo,a fourth tiddler,filter regexp test,has filter,hasList,one,Tiddler Three,TiddlerOne");
			expect(wiki.filterTiddlers("[sort[title]last[x]]").join(",")).toBe("TiddlerOne");
			expect(wiki.filterTiddlers("[sort[title]reverse[]]").join(",")).toBe("TiddlerOne,Tiddler Three,one,hasList,has filter,filter regexp test,a fourth tiddler,$:/TiddlerTwo,$:/ShadowPlugin");
			expect(wiki.filterTiddlers("[sort[title]reverse[x]]").join(",")).toBe("TiddlerOne,Tiddler Three,one,hasList,has filter,filter regexp test,a fourth tiddler,$:/TiddlerTwo,$:/ShadowPlugin");
			expect(wiki.filterTiddlers("[sort[title]butlast[]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,filter regexp test,has filter,hasList,one,Tiddler Three");
			expect(wiki.filterTiddlers("[sort[title]butlast[0]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,filter regexp test,has filter,hasList,one,Tiddler Three,TiddlerOne");
			expect(wiki.filterTiddlers("[sort[title]butlast[2]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,filter regexp test,has filter,hasList,one");
			expect(wiki.filterTiddlers("[sort[title]butlast[11]]").join(",")).toBe("");
			expect(wiki.filterTiddlers("[sort[title]butlast[x]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,filter regexp test,has filter,hasList,one,Tiddler Three");
			expect(wiki.filterTiddlers("[sort[title]rest[]]").join(",")).toBe("$:/TiddlerTwo,a fourth tiddler,filter regexp test,has filter,hasList,one,Tiddler Three,TiddlerOne");
			expect(wiki.filterTiddlers("[sort[title]rest[2]]").join(",")).toBe("a fourth tiddler,filter regexp test,has filter,hasList,one,Tiddler Three,TiddlerOne");
			expect(wiki.filterTiddlers("[sort[title]rest[11]]").join(",")).toBe("");
			expect(wiki.filterTiddlers("[sort[title]rest[x]]").join(",")).toBe("$:/TiddlerTwo,a fourth tiddler,filter regexp test,has filter,hasList,one,Tiddler Three,TiddlerOne");
			expect(wiki.filterTiddlers("[sort[title]nth[]]").join(",")).toBe("$:/ShadowPlugin");
			expect(wiki.filterTiddlers("[sort[title]nth[2]]").join(",")).toBe("$:/TiddlerTwo");
			expect(wiki.filterTiddlers("[sort[title]nth[11]]").join(",")).toBe("");
			expect(wiki.filterTiddlers("[sort[title]nth[x]]").join(",")).toBe("$:/ShadowPlugin");
		});
	
		it("should handle the tag operator", function() {
			expect(wiki.filterTiddlers("[tag[one]sort[title]]").join(",")).toBe("Tiddler Three,TiddlerOne");
			expect(wiki.filterTiddlers("[!tag[one]sort[title]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,filter regexp test,has filter,hasList,one");
			expect(wiki.filterTiddlers("[prefix[Tidd]tag[one]sort[title]]").join(",")).toBe("Tiddler Three,TiddlerOne");
			expect(wiki.filterTiddlers("[!is[shadow]tag[two]sort[title]]").join(",")).toBe("$:/TiddlerTwo,Tiddler Three");
			expect(wiki.filterTiddlers("[all[shadows]tag[two]sort[title]]").join(",")).toBe("$:/TiddlerFive");
		});
	
		it("should handle the all operator with field, has and tag operators", function() {
			expect(wiki.filterTiddlers("[all[shadows]tag[two]]").join(",")).toBe("$:/TiddlerFive");
			expect(wiki.filterTiddlers("[all[shadows+tiddlers]tag[two]]").join(",")).toBe("$:/TiddlerFive,$:/TiddlerTwo,Tiddler Three");
			expect(wiki.filterTiddlers("[all[tiddlers+shadows]tag[two]]").join(",")).toBe("$:/TiddlerTwo,Tiddler Three,$:/TiddlerFive");
			expect(wiki.filterTiddlers("[all[shadows+tiddlers]]").join(",")).toBe("$:/TiddlerFive,Tiddler8,TiddlerSeventh,TiddlerSix,$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,filter regexp test,has filter,hasList,one,Tiddler Three,TiddlerOne");
			expect(wiki.filterTiddlers("[all[tiddlers+shadows]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,filter regexp test,has filter,hasList,one,Tiddler Three,TiddlerOne,$:/TiddlerFive,Tiddler8,TiddlerSeventh,TiddlerSix");
			expect(wiki.filterTiddlers("[all[tiddlers]tag[two]]").join(",")).toBe("$:/TiddlerTwo,Tiddler Three");
			expect(wiki.filterTiddlers("[all[orphans+tiddlers+tags]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,filter regexp test,has filter,hasList,Tiddler Three,TiddlerOne,two,one");
		});
	
		it("should handle the tags operator", function() {
			expect(wiki.filterTiddlers("[tags[]sort[title]]").join(",")).toBe("one,two");
			expect(wiki.filterTiddlers("[[TiddlerOne]tags[]sort[title]]").join(",")).toBe("one");
		});
	
		it("should handle the match operator", function() {
			expect(wiki.filterTiddlers("[match[TiddlerOne]]").join(",")).toBe("TiddlerOne");
			expect(wiki.filterTiddlers("TiddlerOne TiddlerOne =[match[TiddlerOne]]").join(",")).toBe("TiddlerOne,TiddlerOne");
			expect(wiki.filterTiddlers("[!match[TiddlerOne]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,filter regexp test,has filter,hasList,one,Tiddler Three");
			expect(wiki.filterTiddlers("[match:casesensitive[tiddlerone]]").join(",")).toBe("");
			expect(wiki.filterTiddlers("[!match:casesensitive[tiddlerone]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,filter regexp test,has filter,hasList,one,Tiddler Three,TiddlerOne");
			expect(wiki.filterTiddlers("[match:caseinsensitive[tiddlerone]]").join(",")).toBe("TiddlerOne");
			expect(wiki.filterTiddlers("[!match:caseinsensitive[tiddlerone]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,filter regexp test,has filter,hasList,one,Tiddler Three");
		});
	
		it("should handle the tagging operator", function() {
			expect(wiki.filterTiddlers("[[one]tagging[]sort[title]]").join(",")).toBe("Tiddler Three,Tiddler8,TiddlerOne,TiddlerSeventh");
			expect(wiki.filterTiddlers("[[one]tagging[]]").join(",")).toBe("Tiddler Three,TiddlerOne,Tiddler8,TiddlerSeventh");
			expect(wiki.filterTiddlers("[[two]tagging[]sort[title]]").join(",")).toBe("$:/TiddlerFive,$:/TiddlerTwo,Tiddler Three");
			var fakeWidget = {wiki: wiki, getVariable: function(name) {return name === "currentTiddler" ? "one": undefined;}};
			expect(wiki.filterTiddlers("[all[current]tagging[]]",fakeWidget).join(",")).toBe("Tiddler Three,TiddlerOne,Tiddler8,TiddlerSeventh");
		});
	
		it("should handle the untagged operator", function() {
			expect(wiki.filterTiddlers("[untagged[]sort[title]]").join(",")).toBe("$:/ShadowPlugin,a fourth tiddler,filter regexp test,has filter,hasList,one");
			expect(wiki.filterTiddlers("[!untagged[]sort[title]]").join(",")).toBe("$:/TiddlerTwo,Tiddler Three,TiddlerOne");
			// Should consider non-existent tiddlers untagged.
			expect(wiki.filterTiddlers("[enlist[a b c]untagged[]]").join(",")).toBe("a,b,c");
			expect(wiki.filterTiddlers("[enlist[a b c]!untagged[]]").join(",")).toBe("");
		});
	
		it("should handle the links operator", function() {
			expect(wiki.filterTiddlers("[!is[shadow]links[]sort[title]]").join(",")).toBe("$:/TiddlerTwo,a fourth tiddler,has filter,hasList,one,Tiddler Three,TiddlerSix,TiddlerZero");
			expect(wiki.filterTiddlers("[all[shadows]links[]sort[title]]").join(",")).toBe("TiddlerOne");
		});
	
		it("should handle the backlinks operator", function() {
			expect(wiki.filterTiddlers("[!is[shadow]backlinks[]sort[title]]").join(",")).toBe("a fourth tiddler,has filter,hasList,one,TiddlerOne");
			expect(wiki.filterTiddlers("[all[shadows]backlinks[]sort[title]]").join(",")).toBe("Tiddler Three");
		});
	
		it("should handle the has operator", function() {
			expect(wiki.filterTiddlers("[has[modified]sort[title]]").join(",")).toBe("$:/TiddlerTwo,Tiddler Three,TiddlerOne");
			expect(wiki.filterTiddlers("[!has[modified]sort[title]]").join(",")).toBe("$:/ShadowPlugin,a fourth tiddler,filter regexp test,has filter,hasList,one");
			expect(wiki.filterTiddlers("[has[tags]sort[title]]").join(",")).toBe("$:/TiddlerTwo,Tiddler Three,TiddlerOne");
			expect(wiki.filterTiddlers("[!has[tags]sort[title]]").join(",")).toBe("$:/ShadowPlugin,a fourth tiddler,filter regexp test,has filter,hasList,one");
		});
	
		it("should handle the has:field operator", function() {
			expect(wiki.filterTiddlers("[has:field[empty]sort[title]]").join(",")).toBe("a fourth tiddler,one");
			expect(wiki.filterTiddlers("[!has:field[empty]sort[title]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,filter regexp test,has filter,hasList,Tiddler Three,TiddlerOne");
		});
	
	
		it("should handle the limit operator", function() {
			expect(wiki.filterTiddlers("[!is[system]sort[title]limit[2]]").join(",")).toBe("a fourth tiddler,filter regexp test");
			expect(wiki.filterTiddlers("[prefix[Tid]sort[title]limit[1]]").join(",")).toBe("Tiddler Three");
			expect(wiki.filterTiddlers("[prefix[Tid]sort[title]!limit[1]]").join(",")).toBe("TiddlerOne");
		});
	
		it("should handle the list operator", function() {
			expect(wiki.filterTiddlers("[list[TiddlerSeventh]sort[title]]").join(",")).toBe("a fourth tiddler,MissingTiddler,Tiddler Three,TiddlerOne");
			expect(wiki.filterTiddlers("[tag[one]list[TiddlerSeventh]sort[title]]").join(",")).toBe("a fourth tiddler,MissingTiddler,Tiddler Three,TiddlerOne");
		});

		it("should handle the listed operator", function() {
			expect(wiki.filterTiddlers("TiddlerOne MissingTiddler +[listed[]]").join(",")).toBe('hasList,one');
			expect(wiki.filterTiddlers("one two +[listed[tags]]").join(",")).toBe('TiddlerOne,$:/TiddlerTwo,Tiddler Three');
		});
	
		it("should handle the next operator", function() {
			expect(wiki.filterTiddlers("[[Tiddler Three]next[TiddlerSeventh]]").join(",")).toBe("a fourth tiddler");
			expect(wiki.filterTiddlers("[[MissingTiddler]next[TiddlerSeventh]]").join(",")).toBe("");
		});
	
		it("should handle the previous operator", function() {
			expect(wiki.filterTiddlers("[[Tiddler Three]previous[TiddlerSeventh]]").join(",")).toBe("TiddlerOne");
			expect(wiki.filterTiddlers("[[TiddlerOne]previous[TiddlerSeventh]]").join(",")).toBe("");
		});
	
		it("should handle the search operator", function() {
			expect(wiki.filterTiddlers("[search[the]sort[title]]").join(",")).toBe("$:/TiddlerTwo,a fourth tiddler,filter regexp test,has filter,hasList,one,Tiddler Three,TiddlerOne");
			expect(wiki.filterTiddlers("[search{Tiddler8}sort[title]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,has filter,hasList,one,Tiddler Three,TiddlerOne");
			expect(wiki.filterTiddlers("[search:modifier[og]sort[title]]").join(",")).toBe("TiddlerOne");
			expect(wiki.filterTiddlers("[search:modifier,authors:casesensitive[Do]sort[title]]").join(",")).toBe("$:/TiddlerTwo");
			expect(wiki.filterTiddlers("[search:modifier,authors:casesensitive[do]sort[title]]").join(",")).toBe("");
			expect(wiki.filterTiddlers("[search:authors:casesensitive,whitespace[John    Doe]sort[title]]").join(",")).toBe("$:/TiddlerTwo");
			expect(wiki.filterTiddlers("[search:modifier:regexp[(d|bl)o(ggs|e)]sort[title]]").join(",")).toBe("TiddlerOne");
			expect(wiki.filterTiddlers("[search:-modifier,authors:[g]sort[title]]").join(",")).toBe("$:/ShadowPlugin,filter regexp test,Tiddler Three");
			expect(wiki.filterTiddlers("[search:*:[g]sort[title]]").join(",")).toBe("$:/ShadowPlugin,filter regexp test,Tiddler Three,TiddlerOne");
			expect(wiki.filterTiddlers("[search:text:anchored[the]]").join(",")).toBe("$:/TiddlerTwo,a fourth tiddler,Tiddler Three,TiddlerOne");
		});

		it("should yield search results where 'default' search finds at least 1 token", function() {
			expect(wiki.filterTiddlers("[search::some[one two]sort[title]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,one,Tiddler Three,TiddlerOne");
		});

		it("should yield search results where 'title' finds at least one token", function() {
			expect(wiki.filterTiddlers("[search:title:some[tiddler]sort[title]]").join(",")).toBe("$:/TiddlerTwo,a fourth tiddler,Tiddler Three,TiddlerOne");
			expect(wiki.filterTiddlers("[search:title:some[tiddler one]sort[title]]").join(",")).toBe("$:/TiddlerTwo,a fourth tiddler,one,Tiddler Three,TiddlerOne");
		});

		it("should yield search results where 'tags' finds at least one token", function() {
			expect(wiki.filterTiddlers("[search:tags:some[one]sort[title]]").join(",")).toBe("Tiddler Three,TiddlerOne");
			expect(wiki.filterTiddlers("[search:tags:some[two]sort[title]]").join(",")).toBe("$:/TiddlerTwo,Tiddler Three");
			expect(wiki.filterTiddlers("[search:tags:some[two one]sort[title]]").join(",")).toBe("$:/TiddlerTwo,Tiddler Three,TiddlerOne");
		});

		it("should yield search results where 'tags' finds at least one token / casesensitive", function() {
			expect(wiki.filterTiddlers("[search:tags:some[ONE]sort[title]]").join(",")).toBe("Tiddler Three,TiddlerOne");
			expect(wiki.filterTiddlers("[search:tags:some,casesensitive[two ONE]sort[title]]").join(",")).toBe("$:/TiddlerTwo,Tiddler Three");
		});

		it("should yield search results where 'tags' finds at least one token / anchored", function() {
			expect(wiki.filterTiddlers("[search:tags:some,anchored[one]sort[title]]").join(",")).toBe("Tiddler Three,TiddlerOne");
			expect(wiki.filterTiddlers("[search:tags:some,anchored[two]sort[title]]").join(",")).toBe("$:/TiddlerTwo,Tiddler Three");
			// search:title
			expect(wiki.filterTiddlers("[search:title:some,anchored[tiddler]sort[title]]").join(",")).toBe("Tiddler Three,TiddlerOne");
			expect(wiki.filterTiddlers("[search:title:some,anchored[tiddler one]sort[title]]").join(",")).toBe("one,Tiddler Three,TiddlerOne");
		});

		it("should yield search results where 'tags' finds at least one token / anchored & casesensitive", function() {
				expect(wiki.filterTiddlers("[search:title:some,anchored,casesensitive[Tiddler one]sort[title]]").join(",")).toBe("one,Tiddler Three,TiddlerOne");
			expect(wiki.filterTiddlers("[search:title:some,anchored,casesensitive[Tiddler ONE]sort[title]]").join(",")).toBe("Tiddler Three,TiddlerOne");
		});

		it("should yield search results that have search tokens spread across different fields", function() {
			expect(wiki.filterTiddlers("[search[fox one]sort[title]]").join(",")).toBe("TiddlerOne");
		});

		it("should handle the each operator", function() {
			expect(wiki.filterTiddlers("[each[modifier]sort[title]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,filter regexp test,TiddlerOne");
			expect(wiki.filterTiddlers("[each:list-item[tags]sort[title]]").join(",")).toBe("one,two");
			expect(wiki.filterTiddlers("[each:list-item[authors]sort[title]]").join(",")).toBe("Bloggs,Joe,John Doe");
		});
	
		it("should handle the eachday operator", function() {
			expect(wiki.filterTiddlers("[eachday[modified]sort[title]]").join(",")).toBe("$:/TiddlerTwo,Tiddler Three");
		});
	
		it("should handle the sameday operator", function() {
			expect(wiki.filterTiddlers("[sameday[201304152200]sort[title]]").join(",")).toBe("$:/TiddlerTwo,TiddlerOne");
		});
	
		describe("testing the is operator",function() {
	
			it("should handle the '[is[current]]' operator", function() {
			var fakeWidget = {getVariable: function() {return "Tiddler Three";}};
				expect(wiki.filterTiddlers("[is[current]]",fakeWidget).join(",")).toBe("Tiddler Three");
				expect(wiki.filterTiddlers("[[Tiddler Three]is[current]]",fakeWidget).join(",")).toBe("Tiddler Three");
				expect(wiki.filterTiddlers("[[$:/TiddlerTwo]is[current]]",fakeWidget).join(",")).toBe("");
				expect(wiki.filterTiddlers("[!is[current]sort[title]]",fakeWidget).join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,filter regexp test,has filter,hasList,one,TiddlerOne");
			});
	
			it("should handle the '[is[system]]' operator", function() {
				expect(wiki.filterTiddlers("[is[system]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo");
				expect(wiki.filterTiddlers("[!is[system]sort[title]]").join(",")).toBe("a fourth tiddler,filter regexp test,has filter,hasList,one,Tiddler Three,TiddlerOne");
			});
	
			it("should handle the '[is[shadow]]' operator", function() {
				expect(wiki.filterTiddlers("[all[shadows]sort[title]]").join(",")).toBe("$:/TiddlerFive,Tiddler8,TiddlerSeventh,TiddlerSix");
				expect(wiki.filterTiddlers("[!is[shadow]sort[title]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,filter regexp test,has filter,hasList,one,Tiddler Three,TiddlerOne");
			});
	
			it("should handle the '[is[missing]]' operator", function() {
				expect(wiki.filterTiddlers("[all[]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,filter regexp test,has filter,hasList,one,Tiddler Three,TiddlerOne");
				expect(wiki.filterTiddlers("[all[missing]]").join(",")).toBe("TiddlerZero");
				expect(wiki.filterTiddlers("[!is[missing]sort[title]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,filter regexp test,has filter,hasList,one,Tiddler Three,TiddlerOne");
				expect(wiki.filterTiddlers("[[TiddlerOne]is[missing]]").join(",")).toBe("");
				expect(wiki.filterTiddlers("[[TiddlerZero]is[missing]]").join(",")).toBe("TiddlerZero");
				expect(wiki.filterTiddlers("[!title[Tiddler Three]is[missing]]").join(",")).toBe("");
				expect(wiki.filterTiddlers("[!title[Tiddler Three]!is[missing]sort[title]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,a fourth tiddler,filter regexp test,has filter,hasList,one,TiddlerOne");
			});
	
			it("should handle the '[is[orphan]]' operator", function() {
				expect(wiki.filterTiddlers("[is[orphan]sort[title]]").join(",")).toBe("a fourth tiddler,filter regexp test,TiddlerOne");
				expect(wiki.filterTiddlers("[!is[orphan]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,has filter,hasList,one,Tiddler Three");
				expect(wiki.filterTiddlers("[[TiddlerOne]is[orphan]]").join(",")).toBe("TiddlerOne");
				expect(wiki.filterTiddlers("[[TiddlerOne]!is[orphan]]").join(",")).toBe("");
				expect(wiki.filterTiddlers("[!title[Tiddler Three]is[orphan]sort[title]]").join(",")).toBe("a fourth tiddler,filter regexp test,TiddlerOne");
				expect(wiki.filterTiddlers("[!title[Tiddler Three]!is[orphan]]").join(",")).toBe("$:/ShadowPlugin,$:/TiddlerTwo,has filter,hasList,one");
			});

			it("should handle the '[is[draft]]' operator", function() {
				var wiki = new $tw.Wiki();
				wiki.addTiddlers([
					{title: "A"},
					{title: "Draft of 'A'", "draft.of": "A", "draft.title": "A"},
					{title: "B"},
					{title: "Draft of 'B'", "draft.of": "B"},
					{title: "C"},
					// Not a true draft. Doesn't have draft.of
					{title: "Draft of 'C'", "draft.title": "C"},
					{title: "E"},
					// Broken. Has draft.of, but it's empty. Still a draft
					{title: "Draft of 'E'", "draft.of": "", "draft.title": ""}
					// Not a draft. It doesn't exist.
					//{title: "F"} // This one is deliberately missing
				]);
				// is analagous to [has[draft.of]],
				// except they handle empty draft.of differently
				expect(wiki.filterTiddlers("[all[]] F +[is[draft]]").join(",")).toEqual("Draft of 'A',Draft of 'B',Draft of 'E'");
				expect(wiki.filterTiddlers("[all[]] F +[!is[draft]]").join(",")).toEqual("A,B,C,Draft of 'C',E,F");
				// [is[draft]] and [!is[draft]] are proper complements
				var included = wiki.filterTiddlers("[all[]] F +[is[draft]]")
				var excluded = wiki.filterTiddlers("[all[]] F +[!is[draft]]")
				var all = [].concat(included, excluded).sort();
				// combined, they should have exactly one of everything.
				expect(wiki.filterTiddlers("[all[]] F +[sort[]]")).toEqual(all);
			});
	
		});
	
		it("should handle the operand prefixes", function() {
			expect(wiki.filterTiddlers("[prefix[Tiddler]] +[sort[title]]").join(",")).toBe("Tiddler Three,TiddlerOne");
		});
	
		it("should handle indirect operands", function() {
			expect(wiki.filterTiddlers("[{!!missing}]").join(",")).toBe("");
			expect(wiki.filterTiddlers("[{!!title}]").join(",")).toBe("");
			expect(wiki.filterTiddlers("[prefix{Tiddler8}] +[sort[title]]").join(",")).toBe("Tiddler Three,TiddlerOne");
			expect(wiki.filterTiddlers("[modifier{Tiddler8!!test-field}] +[sort[title]]").join(",")).toBe("TiddlerOne");
			var fakeWidget = {wiki: wiki, getVariable: function(name) {return name === "currentTiddler" ? "Tiddler Three": undefined;}};
			expect(wiki.filterTiddlers("[modifier{!!modifier}] +[sort[title]]",fakeWidget).join(",")).toBe("$:/TiddlerTwo,a fourth tiddler,one,Tiddler Three");
		});
	
		it("should handle variable operands", function() {
	
			var widget = require("$:/core/modules/widgets/widget.js");
		// Create a root widget for attaching event handlers. By using it as the parentWidget for another widget tree, one can reuse the event handlers
			var rootWidget = new widget.widget({ type:"widget", children:[ {type:"widget", children:[]} ] },
											   { wiki:wiki, document:$tw.document});
			rootWidget.makeChildWidgets();
			var anchorWidget = rootWidget.children[0];
			rootWidget.setVariable("myVar","Tidd");
			rootWidget.setVariable("myVar2","JoeBloggs");
			expect(wiki.filterTiddlers("[prefix<myVar>] +[sort[title]]",anchorWidget).join(",")).toBe("Tiddler Three,TiddlerOne");
			expect(wiki.filterTiddlers("[modifier<myVar2>] +[sort[title]]",anchorWidget).join(",")).toBe("TiddlerOne");
		});
	
		it("should handle the before and after operators", function() {
			expect(wiki.filterTiddlers("[list[TiddlerSeventh]after[TiddlerOne]]").join(",")).toBe("Tiddler Three");
			expect(wiki.filterTiddlers("[list[TiddlerSeventh]after[a fourth tiddler]]").join(",")).toBe("MissingTiddler");
			expect(wiki.filterTiddlers("[list[TiddlerSeventh]after[MissingTiddler]]").join(",")).toBe("");
			expect(wiki.filterTiddlers("[list[TiddlerSeventh]before[TiddlerOne]]").join(",")).toBe("");
			expect(wiki.filterTiddlers("[list[TiddlerSeventh]before[a fourth tiddler]]").join(",")).toBe("Tiddler Three");
			expect(wiki.filterTiddlers("[list[TiddlerSeventh]before[MissingTiddler]]").join(",")).toBe("a fourth tiddler");
		});
	
		it("should handle the range operator", function() {
			expect(wiki.filterTiddlers("[range[10:0:2]]").join(",")).toBe("10,8,6,4,2,0");
			expect(wiki.filterTiddlers("[range[10;0;2]]").join(",")).toBe("10,8,6,4,2,0");
			expect(wiki.filterTiddlers("[range[1.001,5,1]]").join(",")).toBe("1.001,2.001,3.001,4.001");
			expect(wiki.filterTiddlers("[range[0,10]]").join(",")).toBe("0,1,2,3,4,5,6,7,8,9,10");
			expect(wiki.filterTiddlers("[range[0],[10]]").join(",")).toBe("0,1,2,3,4,5,6,7,8,9,10");
			expect(wiki.filterTiddlers("[range[10,0]]").join(",")).toBe("10,9,8,7,6,5,4,3,2,1,0");
			expect(wiki.filterTiddlers("[range[10],[0]]").join(",")).toBe("10,9,8,7,6,5,4,3,2,1,0");
			expect(wiki.filterTiddlers("[range[0,10,2]]").join(",")).toBe("0,2,4,6,8,10");
			expect(wiki.filterTiddlers("[range[0],[10],[2]]").join(",")).toBe("0,2,4,6,8,10");
			expect(wiki.filterTiddlers("[range[10,0,2]]").join(",")).toBe("10,8,6,4,2,0");
			expect(wiki.filterTiddlers("[range[10],[0],[2]]").join(",")).toBe("10,8,6,4,2,0");
		});
	
		it("should handle the string operators", function() {
			expect(wiki.filterTiddlers("John Paul George Ringo +[length[]]").join(",")).toBe("4,4,6,5");
			expect(wiki.filterTiddlers("John Paul George Ringo +[uppercase[]]").join(",")).toBe("JOHN,PAUL,GEORGE,RINGO");
			expect(wiki.filterTiddlers("John Paul George Ringo +[lowercase[]]").join(",")).toBe("john,paul,george,ringo");
			expect(wiki.filterTiddlers("John Paul George Ringo +[split[]]").join(",")).toBe("J,o,h,n,P,a,u,l,G,e,o,r,g,e,R,i,n,g,o");
			expect(wiki.filterTiddlers("[[John. Paul. George. Ringo.]] +[split[.]trim[]]").join(",")).toBe("John,Paul,George,Ringo,");
			expect(wiki.filterTiddlers("John Paul George Ringo +[split[e]]").join(",")).toBe("John,Paul,G,org,,Ringo");
			expect(wiki.filterTiddlers("John Paul George Ringo +[join[ ]split[e]join[ee]split[ ]]").join(",")).toBe("John,Paul,Geeorgee,Ringo");
			// Ensure that join doesn't return null if passed empty list
			expect(wiki.filterTiddlers("Test +[butlast[]join[ ]]")).toEqual([]);
			// Ensure that join correctly handles empty strings in source
			expect(wiki.filterTiddlers("[[]] Paul +[join[-]]").join(",")).toBe("-Paul");
			expect(wiki.filterTiddlers("[[ John ]] [[Paul ]] [[ George]] Ringo +[trim[]join[-]]").join(",")).toBe("John-Paul-George-Ringo");
			expect(wiki.filterTiddlers("[[ abc ]] [[def ]] [[ ghi]] +[trim[]]").join(",")).toBe("abc,def,ghi");
			expect(wiki.filterTiddlers("[[ abc ]] [[def ]] [[ ghi]] +[trim:prefix[]]").join(",")).toBe("abc ,def ,ghi");
			expect(wiki.filterTiddlers("[[ abc ]] [[def ]] [[ ghi]] +[trim:suffix[]]").join(",")).toBe(" abc,def, ghi");
			expect(wiki.filterTiddlers("[[ abacus ]] [[ baobab ]] +[trim[ab]]").join(",")).toBe(" abacus , baobab ");
			expect(wiki.filterTiddlers("[[ abacus ]] [[ baobab ]] +[trim[a]]").join(",")).toBe(" abacus , baobab ");
			expect(wiki.filterTiddlers("abacus baobab +[trim[a]]").join(",")).toBe("bacus,baobab");
			expect(wiki.filterTiddlers("abacus baobab +[trim[ab]]").join(",")).toBe("acus,baob");
			expect(wiki.filterTiddlers("abacus baobab +[trim:prefix[ab]]").join(",")).toBe("acus,baobab");
			expect(wiki.filterTiddlers("abacus baobab +[trim:suffix[ab]]").join(",")).toBe("abacus,baob");
			// Trim doesn't hiccup on regexp special characters
			expect(wiki.filterTiddlers("[[.*abacus.*]] [[.+baobab.+]] +[trim[.*]]").join(",")).toBe("abacus,.+baobab.+");
			expect(wiki.filterTiddlers("[[.*abacus.*]] [[.+baobab.+]] +[trim[.+]]").join(",")).toBe(".*abacus.*,baobab");
		});
	
		it("should handle the mathematics operators", function() {
			expect(wiki.filterTiddlers("[[2]add[2]]").join(",")).toBe("4");
			expect(wiki.filterTiddlers("[[4]subtract[2]]").join(",")).toBe("2");
			expect(wiki.filterTiddlers("[[24]divide[8]]").join(",")).toBe("3");
			expect(wiki.filterTiddlers("[[355]divide[113]sign[]multiply[4]]").join(",")).toBe("4");
			expect(wiki.filterTiddlers("[[355]divide[113]add[0.5]round[]multiply[4]]").join(",")).toBe("16");
			expect(wiki.filterTiddlers("1 2 3 4 +[sum[]]").join(",")).toBe("10");
			expect(wiki.filterTiddlers("1 2 3 4 +[product[]]").join(",")).toBe("24");
			expect(wiki.filterTiddlers("1 2 3 4 +[maxall[]]").join(",")).toBe("4");
			expect(wiki.filterTiddlers("1 2 3 4 +[minall[]]").join(",")).toBe("1");
			expect(wiki.filterTiddlers("1 2 3 4 +[max[2]]").join(",")).toBe("2,2,3,4");
			expect(wiki.filterTiddlers("1 2 3 4 +[min[2]]").join(",")).toBe("1,2,2,2");
		});
	
	/* listops filters */
		
		it("should handle the allafter operator", function() {
			expect(wiki.filterTiddlers("1 2 3 4 +[allafter[]]").join(",")).toBe("");
			expect(wiki.filterTiddlers("1 2 3 4 +[allafter:include[]]").join(",")).toBe("");
			expect(wiki.filterTiddlers("1 2 3 4 +[allafter[1]]").join(",")).toBe("2,3,4");
			expect(wiki.filterTiddlers("1 2 3 4 +[allafter:include[1]]").join(",")).toBe("1,2,3,4");
			expect(wiki.filterTiddlers("1 2 3 4 +[allafter[2]]").join(",")).toBe("3,4");
			expect(wiki.filterTiddlers("1 2 3 4 +[allafter:include[2]]").join(",")).toBe("2,3,4");
			expect(wiki.filterTiddlers("1 2 3 4 +[allafter[3]]").join(",")).toBe("4");
			expect(wiki.filterTiddlers("1 2 3 4 +[allafter:include[3]]").join(",")).toBe("3,4");
			expect(wiki.filterTiddlers("1 2 3 4 +[allafter[4]]").join(",")).toBe("");
			expect(wiki.filterTiddlers("1 2 3 4 +[allafter:include[4]]").join(",")).toBe("4");
			expect(wiki.filterTiddlers("1 2 3 4 +[allafter[5]]").join(",")).toBe("");
			expect(wiki.filterTiddlers("1 2 3 4 +[allafter:include[5]]").join(",")).toBe("");
		});
	
		it("should handle the allbefore operator", function() {
			expect(wiki.filterTiddlers("1 2 3 4 +[allbefore[]]").join(",")).toBe("");
			expect(wiki.filterTiddlers("1 2 3 4 +[allbefore:include[]]").join(",")).toBe("");
			expect(wiki.filterTiddlers("1 2 3 4 +[allbefore[1]]").join(",")).toBe("");
			expect(wiki.filterTiddlers("1 2 3 4 +[allbefore:include[1]]").join(",")).toBe("1");
			expect(wiki.filterTiddlers("1 2 3 4 +[allbefore[2]]").join(",")).toBe("1");
			expect(wiki.filterTiddlers("1 2 3 4 +[allbefore:include[2]]").join(",")).toBe("1,2");
			expect(wiki.filterTiddlers("1 2 3 4 +[allbefore[3]]").join(",")).toBe("1,2");
			expect(wiki.filterTiddlers("1 2 3 4 +[allbefore:include[3]]").join(",")).toBe("1,2,3");
			expect(wiki.filterTiddlers("1 2 3 4 +[allbefore[4]]").join(",")).toBe("1,2,3");
			expect(wiki.filterTiddlers("1 2 3 4 +[allbefore:include[4]]").join(",")).toBe("1,2,3,4");
			expect(wiki.filterTiddlers("1 2 3 4 +[allbefore[5]]").join(",")).toBe("");
			expect(wiki.filterTiddlers("1 2 3 4 +[allbefore:include[5]]").join(",")).toBe("");
		});
	
		it("should handle the append operator", function() {
			expect(wiki.filterTiddlers("a b c +[append[d e]]").join(",")).toBe("a,b,c,d,e");
			expect(wiki.filterTiddlers("a b c +[append:1[d e]]").join(",")).toBe("a,b,c,d");
			expect(wiki.filterTiddlers("a b c +[append{TiddlerSeventh!!list}]").join(",")).toBe("a,b,c,TiddlerOne,Tiddler Three,a fourth tiddler,MissingTiddler");
			expect(wiki.filterTiddlers("a b c +[append:2{TiddlerSeventh!!list}]").join(",")).toBe("a,b,c,TiddlerOne,Tiddler Three");
			
			expect(wiki.filterTiddlers("a [[b c]] +[append{TiddlerSix!!filter}]").join(",")).toBe("a,b c,one,a a,[subfilter{hasList!!list}]");
		});

		it("should handle the insertafter operator", function() {
			var widget = require("$:/core/modules/widgets/widget.js");
			var rootWidget = new widget.widget({ type:"widget", children:[ {type:"widget", children:[]} ] },
											   { wiki:wiki, document:$tw.document});
			rootWidget.makeChildWidgets();
			var anchorWidget = rootWidget.children[0];
			rootWidget.setVariable("myVar","c");
			rootWidget.setVariable("tidTitle","e");
			rootWidget.setVariable("tidList","one tid with spaces");

			// Position title specified as suffix.
			expect(wiki.filterTiddlers("a b c d e f +[insertafter:myVar[f]]",anchorWidget).join(",")).toBe("a,b,c,f,d,e");
			expect(wiki.filterTiddlers("a b c d e f +[insertafter:myVar<tidTitle>]",anchorWidget).join(",")).toBe("a,b,c,e,d,f");
			expect(wiki.filterTiddlers("a b c d e f +[insertafter:myVar[gg gg]]",anchorWidget).join(",")).toBe("a,b,c,gg gg,d,e,f");
			expect(wiki.filterTiddlers("a b c d e +[insertafter:myVar<tidList>]",anchorWidget).join(",")).toBe("a,b,c,one tid with spaces,d,e");
			expect(wiki.filterTiddlers("a b c d e f +[insertafter:tidTitle{TiddlerOne!!tags}]",anchorWidget).join(",")).toBe("a,b,c,d,e,one,f");

			// Position title specified as parameter.
			expect(wiki.filterTiddlers("a b c d e +[insertafter[f],[a]]",anchorWidget).join(",")).toBe("a,f,b,c,d,e");
			expect(wiki.filterTiddlers("a b c d e +[insertafter[f],<myVar>]",anchorWidget).join(",")).toBe("a,b,c,f,d,e");

			// Parameter takes precedence over suffix.
			expect(wiki.filterTiddlers("a b c d e +[insertafter:myVar[f],[a]]",anchorWidget).join(",")).toBe("a,f,b,c,d,e");

			// No position title.
			expect(wiki.filterTiddlers("a b c [[with space]] +[insertafter[b]]").join(",")).toBe("a,c,with space,b");

			// Position title does not exist, and no suffix given.
			expect(wiki.filterTiddlers("a b c d e +[insertafter:foo[b]]").join(",")).toBe("a,c,d,e,b");
			expect(wiki.filterTiddlers("a b c d e +[insertafter[b],[foo]]").join(",")).toBe("a,c,d,e,b");
			expect(wiki.filterTiddlers("a b c d e +[insertafter[b],<foo>]").join(",")).toBe("a,c,d,e,b");

			// Position title does not exist, but "start" or "end" given as suffix
			expect(wiki.filterTiddlers("a b c d e +[insertafter:start[b],[foo]]").join(",")).toBe("b,a,c,d,e");
			expect(wiki.filterTiddlers("a b c d e +[insertafter:start[b],<foo>]").join(",")).toBe("b,a,c,d,e");
			expect(wiki.filterTiddlers("a b c d e +[insertafter:end[b],[foo]]").join(",")).toBe("a,c,d,e,b");
			expect(wiki.filterTiddlers("a b c d e +[insertafter:end[b],<foo>]").join(",")).toBe("a,c,d,e,b");
		});

		it("should handle the insertbefore operator", function() {
			var widget = require("$:/core/modules/widgets/widget.js");
			var rootWidget = new widget.widget({ type:"widget", children:[ {type:"widget", children:[]} ] },
											   { wiki:wiki, document:$tw.document});
			rootWidget.makeChildWidgets();
			var anchorWidget = rootWidget.children[0];
			rootWidget.setVariable("myVar","c");
			rootWidget.setVariable("tidTitle","e");
			rootWidget.setVariable("tidList","one tid with spaces");
			
			// Position title specified as suffix.
			expect(wiki.filterTiddlers("a b c d e f +[insertbefore:myVar[f]]",anchorWidget).join(",")).toBe("a,b,f,c,d,e");
			expect(wiki.filterTiddlers("a b c d e f +[insertbefore:myVar<tidTitle>]",anchorWidget).join(",")).toBe("a,b,e,c,d,f");
			expect(wiki.filterTiddlers("a b c d e f +[insertbefore:myVar[gg gg]]",anchorWidget).join(",")).toBe("a,b,gg gg,c,d,e,f");
			expect(wiki.filterTiddlers("a b c d e +[insertbefore:myVar<tidList>]",anchorWidget).join(",")).toBe("a,b,one tid with spaces,c,d,e");
			expect(wiki.filterTiddlers("a b c d e f +[insertbefore:tidTitle{TiddlerOne!!tags}]",anchorWidget).join(",")).toBe("a,b,c,d,one,e,f");

			// Position title specified as parameter.
			expect(wiki.filterTiddlers("a b c d e +[insertbefore[f],[a]]",anchorWidget).join(",")).toBe("f,a,b,c,d,e");
			expect(wiki.filterTiddlers("a b c d e +[insertbefore[f],<myVar>]",anchorWidget).join(",")).toBe("a,b,f,c,d,e");

			// Parameter takes precedence over suffix.
			expect(wiki.filterTiddlers("a b c d e +[insertbefore:myVar[f],[a]]",anchorWidget).join(",")).toBe("f,a,b,c,d,e");
	
			// No position title.
			expect(wiki.filterTiddlers("a b c [[with space]] +[insertbefore[b]]").join(",")).toBe("a,c,with space,b");

			// Position title does not exist, and no suffix given.
			expect(wiki.filterTiddlers("a b c d e +[insertbefore:foo[b]]").join(",")).toBe("a,c,d,e,b");
			expect(wiki.filterTiddlers("a b c d e +[insertbefore[b],[foo]]").join(",")).toBe("a,c,d,e,b");
			expect(wiki.filterTiddlers("a b c d e +[insertbefore[b],<foo>]").join(",")).toBe("a,c,d,e,b");

			// Position title does not exist, but "start" or "end" given as suffix
			expect(wiki.filterTiddlers("a b c d e +[insertbefore:start[b],[foo]]").join(",")).toBe("b,a,c,d,e");
			expect(wiki.filterTiddlers("a b c d e +[insertbefore:start[b],<foo>]").join(",")).toBe("b,a,c,d,e");
			expect(wiki.filterTiddlers("a b c d e +[insertbefore:end[b],[foo]]").join(",")).toBe("a,c,d,e,b");
			expect(wiki.filterTiddlers("a b c d e +[insertbefore:end[b],<foo>]").join(",")).toBe("a,c,d,e,b");
		});
	
		it("should handle the move operator", function() {
			expect(wiki.filterTiddlers("a b c d e +[move[c]]").join(",")).toBe("a,b,d,c,e");
			expect(wiki.filterTiddlers("a b c d e +[move:2[c]]").join(",")).toBe("a,b,d,e,c");
			expect(wiki.filterTiddlers("a b c d e +[move:10[c]]").join(",")).toBe("a,b,d,e,c");
			expect(wiki.filterTiddlers("a b c d e +[move:-1[c]]").join(",")).toBe("a,c,b,d,e");
			expect(wiki.filterTiddlers("a b c d e +[move:-5[c]]").join(",")).toBe("c,a,b,d,e");
		});
	
		it("should handle the prepend operator", function() {
			expect(wiki.filterTiddlers("a b c +[prepend[dd ee]]").join(",")).toBe("dd,ee,a,b,c");
			expect(wiki.filterTiddlers("a b c +[prepend:3[ff gg]]").join(",")).toBe("ff,gg,a,b,c");
			expect(wiki.filterTiddlers("a b c +[prepend:1[hh ii]]").join(",")).toBe("hh,a,b,c");
			expect(wiki.filterTiddlers("a b c +[prepend:0[jj kk]]").join(",")).toBe("a,b,c");
			
			expect(wiki.filterTiddlers("a b c +[prepend:-0[ll mm]]").join(",")).toBe("a,b,c");
			expect(wiki.filterTiddlers("a b c +[prepend:-1[nn oo pp qq]]").join(",")).toBe("nn,oo,pp,a,b,c");
			expect(wiki.filterTiddlers("a b c +[prepend:-2[rr ss tt uu]]").join(",")).toBe("rr,ss,a,b,c");
			expect(wiki.filterTiddlers("a b c +[prepend:-4[rr ss tt uu]]").join(",")).toBe("a,b,c");
			expect(wiki.filterTiddlers("a b c +[prepend:-5[vv ww xx yy]]").join(",")).toBe("a,b,c");
		});
	
		it("should handle the putafter operator", function() {
			expect(wiki.filterTiddlers("a b c dd ee +[putafter[b]]").join(",")).toBe("a,b,ee,c,dd");
			expect(wiki.filterTiddlers("a b c dd ee +[putafter:1[b]]").join(",")).toBe("a,b,ee,c,dd");
			expect(wiki.filterTiddlers("a b c dd ee +[putafter:2[b]]").join(",")).toBe("a,b,dd,ee,c");
			expect(wiki.filterTiddlers("a b c dd ee +[putafter:3[b]]").join(",")).toBe("a,b,c,dd,ee");
			// It starts to duplicate elements
			expect(wiki.filterTiddlers("a b c dd ee +[putafter:4[b]]").join(",")).toBe("a,b,b,c,dd,ee");
			expect(wiki.filterTiddlers("a b c dd ee +[putafter:5[b]]").join(",")).toBe("a,b,a,b,c,dd,ee");
			// There are only 5 elements in the input
			expect(wiki.filterTiddlers("a b c ff gg +[putafter:6[b]]").join(",")).toBe("a,b,a,b,c,ff,gg");
	
			// -1 starts to "eat" elements for the left and duplicates b
			expect(wiki.filterTiddlers("a b c hh ii +[putafter:-1[b]]").join(",")).toBe("a,b,b,c,hh,ii");
			// -2 moves c, hh, ii behind b, which is not visible
			expect(wiki.filterTiddlers("a b c hh ii +[putafter:-2[b]]").join(",")).toBe("a,b,c,hh,ii");
			// only ii is used from input and it's moved behind b
			expect(wiki.filterTiddlers("a b c hh ii +[putafter:-4[b]]").join(",")).toBe("a,b,ii,c,hh");
			// wasting time, because there are only 5 elements
			expect(wiki.filterTiddlers("a b c hh ii +[putafter:-5[b]]").join(",")).toBe("a,b,c,hh,ii");
			// there are only 5 elements
			expect(wiki.filterTiddlers("a b c hh ii +[putafter:-10[b]]").join(",")).toBe("a,b,c,hh,ii");
	
			// use NAN uses default = 1
			expect(wiki.filterTiddlers("a b c jj kk +[putafter:NAN[b]]").join(",")).toBe("a,b,kk,c,jj");
		});
	
		it("should handle the putbefore operator", function() {
			expect(wiki.filterTiddlers("a b c dd +[putbefore[b]]").join(",")).toBe("a,dd,b,c");
			expect(wiki.filterTiddlers("a b c ff +[putbefore:1[b]]").join(",")).toBe("a,ff,b,c");
			expect(wiki.filterTiddlers("a b c gg +[putbefore:2[b]]").join(",")).toBe("a,c,gg,b");
	
			expect(wiki.filterTiddlers("a b c [[g g]] +[putbefore:2[b]]").join(",")).toBe("a,c,g g,b");
	
			// this one is strange
			expect(wiki.filterTiddlers("a b c ee +[putbefore:0[b]]").join(",")).toBe("a,a,b,c,ee");
			
			// b is not part of the list anymore, so it will be appended at the end ???
			expect(wiki.filterTiddlers("a b c hh +[putbefore:3[b]]").join(",")).toBe("a,b,c,hh");
			expect(wiki.filterTiddlers("a b c ii +[putbefore:4[b]]").join(",")).toBe("a,a,b,c,ii");
			
			// ????
			expect(wiki.filterTiddlers("a b c ii +[putbefore:10[b]]").join(",")).toBe("a,a,b,c,ii");
			
			expect(wiki.filterTiddlers("a b c kk +[putbefore:-1[b]]").join(",")).toBe("a,b,c,kk");
			expect(wiki.filterTiddlers("a b c ll +[putbefore:-2[b]]").join(",")).toBe("a,c,ll,b");
			
			expect(wiki.filterTiddlers("a b c mm +[putbefore:-3[b]]").join(",")).toBe("a,mm,b,c");
			
			expect(wiki.filterTiddlers("a b c nn +[putbefore:-10[b]]").join(",")).toBe("a,b,c,nn");
		});
	
		it("should handle the putfirst operator", function() {
			expect(wiki.filterTiddlers("a b c +[putfirst[a b]]").join(",")).toBe("c,a,b");
			expect(wiki.filterTiddlers("a b c +[putfirst[]]").join(",")).toBe("c,a,b");
			expect(wiki.filterTiddlers("a b c +[putfirst:2[]]").join(",")).toBe("b,c,a");
			expect(wiki.filterTiddlers("a b c +[putfirst:3[]]").join(",")).toBe("a,b,c");
			expect(wiki.filterTiddlers("a b c +[putfirst:4[]]").join(",")).toBe("a,b,c");
			expect(wiki.filterTiddlers("a b c +[putfirst:-0[]]").join(",")).toBe("a,b,c");
			expect(wiki.filterTiddlers("a b c +[putfirst:-1[]]").join(",")).toBe("b,c,a");
			expect(wiki.filterTiddlers("a b c +[putfirst:-2[]]").join(",")).toBe("c,a,b");
			expect(wiki.filterTiddlers("a b c +[putfirst:-4[]]").join(",")).toBe("a,b,c");
		});
	
		it("should handle the putlast operator", function() {
			expect(wiki.filterTiddlers("a b c +[putlast[d e]]").join(",")).toBe("b,c,a");
			expect(wiki.filterTiddlers("a b c +[putlast[]]").join(",")).toBe("b,c,a");
			expect(wiki.filterTiddlers("a b c +[putlast:1[]]").join(",")).toBe("b,c,a");
			expect(wiki.filterTiddlers("a b c +[putlast:2[]]").join(",")).toBe("c,a,b");
			expect(wiki.filterTiddlers("a b c +[putlast:3[]]").join(",")).toBe("a,b,c");
			expect(wiki.filterTiddlers("a b c +[putlast:4[]]").join(",")).toBe("a,b,c");
			expect(wiki.filterTiddlers("a b c +[putlast:-0[]]").join(",")).toBe("a,b,c");
			expect(wiki.filterTiddlers("a b c +[putlast:0[]]").join(",")).toBe("a,b,c");
			expect(wiki.filterTiddlers("a b c +[putlast:-1[]]").join(",")).toBe("c,a,b");
			expect(wiki.filterTiddlers("a b c +[putlast:-2[]]").join(",")).toBe("b,c,a");
			expect(wiki.filterTiddlers("a b c +[putlast:-4[]]").join(",")).toBe("a,b,c");
		});
	
		it("should handle the remove operator", function() {
			expect(wiki.filterTiddlers("a b c +[remove[d e]]").join(",")).toBe("a,b,c");
			expect(wiki.filterTiddlers("a b c +[remove[a]]").join(",")).toBe("b,c");
			expect(wiki.filterTiddlers("a b c +[remove[c b a]]").join(",")).toBe("");
		});
	
		it("should handle the replace operator", function() {
			expect(wiki.filterTiddlers("a b c dd +[replace[a]]").join(",")).toBe("dd,b,c");
			expect(wiki.filterTiddlers("a b c dd ee +[replace:2[a]]").join(",")).toBe("dd,ee,b,c");
			expect(wiki.filterTiddlers("a b c dd ee +[replace:5[c]]").join(",")).toBe("a,b,a,b,c,dd,ee");
			
			// strange things happen.
			expect(wiki.filterTiddlers("a b c dd ee +[replace:-1[c]]").join(",")).toBe("a,b,b,c,dd,ee");
			expect(wiki.filterTiddlers("a b c dd ee +[replace:-2[c]]").join(",")).toBe("a,b,c,dd,ee");
			expect(wiki.filterTiddlers("a b c dd ee +[replace:-2[ee]]").join(",")).toBe("a,b,c,dd,c,dd,ee");
		});
	
		it("should handle the sortby operator", function() {
			expect(wiki.filterTiddlers("a b c +[sortby[d e]]").join(",")).toBe("a,b,c");
			expect(wiki.filterTiddlers("a b c +[sortby[b c a]]").join(",")).toBe("b,c,a");
			expect(wiki.filterTiddlers("aa a b c +[sortby[b c a cc]]").join(",")).toBe("aa,b,c,a");
			expect(wiki.filterTiddlers("a bb b c +[sortby[b c a cc]]").join(",")).toBe("bb,b,c,a");
			expect(wiki.filterTiddlers("a bb cc b c +[sortby[b c a cc]]").join(",")).toBe("bb,b,c,a,cc");
	
			expect(wiki.filterTiddlers("b a b c +[sortby[]]").join(",")).toBe("a,b,c");
			expect(wiki.filterTiddlers("b a b c +[sortby[a b b c]]").join(",")).toBe("a,b,c");
			expect(wiki.filterTiddlers("b a b c +[sortby[b a c b]]").join(",")).toBe("b,a,c");
		});
	
		it("should handle the sortan operator", function() {
			expect(wiki.filterTiddlers("b a c +[sortan[]]").join(",")).toBe("a,b,c");
			expect(wiki.filterTiddlers("b2 a3 a1 b1 c2 a2 c3 b3 c1 +[sortan[]]").join(",")).toBe("a1,a2,a3,b1,b2,b3,c1,c2,c3");
			expect(wiki.filterTiddlers("b2 a10 c10 a1 b1 c2 a2 b10 c1 +[sortan[]]").join(",")).toBe("a1,a2,a10,b1,b2,b10,c1,c2,c10");
			expect(wiki.filterTiddlers("TiddlerOne $:/TiddlerTwo [[Tiddler Three]] +[sortan[]]").join(",")).toBe("$:/TiddlerTwo,Tiddler Three,TiddlerOne");
		});
	
		it("should handle the sortan operator sorting on date fields", function() {
			expect(wiki.filterTiddlers("TiddlerOne $:/TiddlerTwo [[Tiddler Three]] +[sortan[modified]]").join(",")).toBe("$:/TiddlerTwo,TiddlerOne,Tiddler Three");
			expect(wiki.filterTiddlers("hasList TiddlerOne $:/TiddlerTwo [[Tiddler Three]] +[sortan[modified]]").join(",")).toBe("hasList,$:/TiddlerTwo,TiddlerOne,Tiddler Three");
		});
	
		it("should handle the slugify operator", function() {
			expect(wiki.filterTiddlers("[[Joe Bloggs]slugify[]]").join(",")).toBe("joe-bloggs");
			expect(wiki.filterTiddlers("[[Joe Bloggs2]slugify[]]").join(",")).toBe("joe-bloggs2");
			expect(wiki.filterTiddlers("[[@£$%^&*((]slugify[]]").join(",")).toBe("64-163-36-37-94-38-42-40-40");
			expect(wiki.filterTiddlers("One one ONE O!N!E +[slugify[]]").join(",")).toBe("one,one,one,one");
			expect(wiki.filterTiddlers("TiddlerOne $:/TiddlerTwo +[slugify[]]").join(",")).toBe("tiddler-one,tiddler-two");
		});
	
		it("should handle the sortsub operator", function() {
			var widget = require("$:/core/modules/widgets/widget.js");
			var rootWidget = new widget.widget({ type:"widget", children:[ {type:"widget", children:[]} ] },
											   { wiki:wiki, document:$tw.document});
			rootWidget.makeChildWidgets();
			var anchorWidget = rootWidget.children[0];
			rootWidget.setVariable("sort1","[length[]]");
			rootWidget.setVariable("sort2","[get[text]else[]length[]]");
			rootWidget.setVariable("sort3","[{!!value}divide{!!cost}]");
			rootWidget.setVariable("sort4","[{!!title}]");
			rootWidget.setVariable("undefined-variable","[<doesnotexist>]");
			rootWidget.setVariable("echo","$text$",[{name:"text"}],true);
			rootWidget.setVariable("sort4-macro-param","[subfilter<echo '[{!!title}]'>]");
			expect(wiki.filterTiddlers("[sortsub:number<sort1>]",anchorWidget).join(",")).toBe("one,hasList,has filter,TiddlerOne,$:/TiddlerTwo,Tiddler Three,$:/ShadowPlugin,a fourth tiddler,filter regexp test");
			expect(wiki.filterTiddlers("[!sortsub:number<sort1>]",anchorWidget).join(",")).toBe("filter regexp test,a fourth tiddler,$:/ShadowPlugin,$:/TiddlerTwo,Tiddler Three,has filter,TiddlerOne,hasList,one");
			expect(wiki.filterTiddlers("[sortsub:string<sort1>]",anchorWidget).join(",")).toBe("has filter,TiddlerOne,$:/TiddlerTwo,Tiddler Three,$:/ShadowPlugin,a fourth tiddler,filter regexp test,one,hasList");
			expect(wiki.filterTiddlers("[!sortsub:string<sort1>]",anchorWidget).join(",")).toBe("hasList,one,filter regexp test,a fourth tiddler,$:/ShadowPlugin,$:/TiddlerTwo,Tiddler Three,has filter,TiddlerOne");
			expect(wiki.filterTiddlers("[sortsub:number<sort2>]",anchorWidget).join(",")).toBe("one,TiddlerOne,hasList,has filter,a fourth tiddler,$:/TiddlerTwo,Tiddler Three,filter regexp test,$:/ShadowPlugin");
			expect(wiki.filterTiddlers("[!sortsub:number<sort2>]",anchorWidget).join(",")).toBe("$:/ShadowPlugin,filter regexp test,Tiddler Three,$:/TiddlerTwo,a fourth tiddler,has filter,hasList,TiddlerOne,one");
			expect(wiki.filterTiddlers("[sortsub:string<sort2>]",anchorWidget).join(",")).toBe("one,TiddlerOne,hasList,has filter,$:/ShadowPlugin,a fourth tiddler,$:/TiddlerTwo,Tiddler Three,filter regexp test");
			expect(wiki.filterTiddlers("[!sortsub:string<sort2>]",anchorWidget).join(",")).toBe("filter regexp test,Tiddler Three,$:/TiddlerTwo,a fourth tiddler,$:/ShadowPlugin,has filter,hasList,TiddlerOne,one");
			expect(wiki.filterTiddlers("[[TiddlerOne]] [[$:/TiddlerTwo]] [[Tiddler Three]] [[a fourth tiddler]] +[!sortsub:number<sort3>]",anchorWidget).join(",")).toBe("$:/TiddlerTwo,Tiddler Three,TiddlerOne,a fourth tiddler");
			expect(wiki.filterTiddlers("a1 a10 a2 a3 b10 b3 b1 c9 c11 c1 +[sortsub:alphanumeric<sort4>]",anchorWidget).join(",")).toBe("a1,a2,a3,a10,b1,b3,b10,c1,c9,c11");
			// #7155. The order of the output is the same as the input when an undefined variable is used in the subfitler
			expect(wiki.filterTiddlers("a2 a10 a1 +[sortsub:alphanumeric<undefined-variable>]",anchorWidget).join(",")).toBe("a2,a10,a1");
			expect(wiki.filterTiddlers("a1 a10 a2 a3 b10 b3 b1 c9 c11 c1 +[sortsub:alphanumeric<sort4-macro-param>]",anchorWidget).join(",")).toBe("a1,a2,a3,a10,b1,b3,b10,c1,c9,c11");
		});
		
		it("should handle the toggle operator", function() {
			expect(wiki.filterTiddlers("[[Tiddler Three]tags[]] +[toggle[one]]").join(",")).toBe("two");
			expect(wiki.filterTiddlers("[[Tiddler Three]tags[]] -[[one]] +[toggle[one]]").join(",")).toBe("two,one");
			expect(wiki.filterTiddlers("[[Tiddler Three]tags[]] +[toggle[three],[four]]").join(",")).toBe("one,two,three");
			expect(wiki.filterTiddlers("[[Tiddler Three]tags[]] [[three]] +[toggle[three],[four]]").join(",")).toBe("one,two,four");
			expect(wiki.filterTiddlers("[[Tiddler Three]tags[]] [[three]] [[four]] +[toggle[three],[five]]").join(",")).toBe("one,two,five,four");
		});
	
		it("should handle multiple operands for search-replace", function() {
			var widget = require("$:/core/modules/widgets/widget.js");
			var rootWidget = new widget.widget({ type:"widget", children:[ {type:"widget", children:[]} ] },
											   { wiki:wiki, document:$tw.document});
			rootWidget.makeChildWidgets();
			var anchorWidget = rootWidget.children[0];
			rootWidget.setVariable("var1","different");
			rootWidget.setVariable("myregexp1","e|o");
			rootWidget.setVariable("myregexp2","^Unlike ");
			rootWidget.setVariable("myregexp3","^(?!Unlike).*$");
			rootWidget.setVariable("name","(\w+)\s(\w+)");
			expect(wiki.filterTiddlers("[[Welcome to TiddlyWiki, a unique non-linear webpage.]search-replace[webpage],[notebook]]").join(",")).toBe("Welcome to TiddlyWiki, a unique non-linear notebook.");
			expect(wiki.filterTiddlers("[[Welcome to TiddlyWiki, a unique non-linear notebook.]search-replace[unique],<var1>]",anchorWidget).join(",")).toBe("Welcome to TiddlyWiki, a different non-linear notebook.");
			expect(wiki.filterTiddlers("[[Welcome to TiddlyWiki, a unique non-linear notebook.]search-replace[TiddlyWiki],{one}]",anchorWidget).join(",")).toBe("Welcome to This is the text of tiddler [[one]], a unique non-linear notebook.");
			expect(wiki.filterTiddlers("[[Hello There]search-replace:g:regexp<myregexp1>,[]]",anchorWidget).join(",")).toBe("Hll Thr");
			expect(wiki.filterTiddlers("[[Hello There]search-replace::regexp<myregexp1>,[]]",anchorWidget).join(",")).toBe("Hllo There");
			expect(wiki.filterTiddlers("[[Hello There]search-replace:gi[H],[]]",anchorWidget).join(",")).toBe("ello Tere");
			expect(wiki.filterTiddlers("[[Unlike conventional online services, TiddlyWiki lets you choose where to keep your data\nUnlike conventional online services, TiddlyWiki lets you choose where to keep your data\nUnlike conventional online services, TiddlyWiki lets you choose where to keep your data\nUnlike conventional online services, TiddlyWiki lets you choose where to keep your data]search-replace:g:regexp<myregexp2>,[]]",anchorWidget).join(",")).toBe("conventional online services, TiddlyWiki lets you choose where to keep your data\nUnlike conventional online services, TiddlyWiki lets you choose where to keep your data\nUnlike conventional online services, TiddlyWiki lets you choose where to keep your data\nUnlike conventional online services, TiddlyWiki lets you choose where to keep your data");
			expect(wiki.filterTiddlers("[[Unlike conventional online services, TiddlyWiki lets you choose where to keep your data\nUnlike conventional online services, TiddlyWiki lets you choose where to keep your data\nUnlike conventional online services, TiddlyWiki lets you choose where to keep your data\nUnlike conventional online services, TiddlyWiki lets you choose where to keep your data]search-replace:gm:regexp<myregexp2>,[]]",anchorWidget).join(",")).toBe("conventional online services, TiddlyWiki lets you choose where to keep your data\nconventional online services, TiddlyWiki lets you choose where to keep your data\nconventional online services, TiddlyWiki lets you choose where to keep your data\nconventional online services, TiddlyWiki lets you choose where to keep your data");
			expect(wiki.filterTiddlers("[[Hello There\nUnlike conventional online services, TiddlyWiki lets you choose where to keep your data\nguaranteeing that in the decades to come you will still be able to use the notes you take today.]search-replace:gm:regexp<myregexp3>,[]]",anchorWidget).join(",")).toBe("\nUnlike conventional online services, TiddlyWiki lets you choose where to keep your data\n");
			expect(wiki.filterTiddlers("[[This is equation $$x$$ end.]search-replace[equation $$x$$ end.],[relation $$x$$ finish.]]").join(",")).toBe("This is relation $$x$$ finish.");
			expect(wiki.filterTiddlers("[[This is an amazing TiddlyWiki]] [[How old is TiddlyWiki?. TiddlyWiki is great]] [[My TiddlyWiki is so fast.]] +[search-replace:g:regexp[TiddlyWiki],[TW]]").join(",")).toBe("This is an amazing TW,How old is TW?. TW is great,My TW is so fast.");
			expect(wiki.filterTiddlers("[[This is an amazing TiddlyWiki]] [[How old is TiddlyWiki?. TiddlyWiki is great]] [[My TiddlyWiki is so fast.]] +[search-replace::regexp[TiddlyWiki],[TW]]").join(",")).toBe("This is an amazing TW,How old is TW?. TiddlyWiki is great,My TW is so fast.");
			expect(wiki.filterTiddlers("[[This is an amazing TiddlyWiki]] [[How old is TiddlyWiki?. TiddlyWiki is great]] [[My TiddlyWiki is so fast.]] +[search-replace:g[TiddlyWiki],[TW]]").join(",")).toBe("This is an amazing TW,How old is TW?. TW is great,My TW is so fast.");
		});
		
		it("should handle the pad operator", function() {
		expect(wiki.filterTiddlers("[[2]pad[]]").join(",")).toBe("2");
		expect(wiki.filterTiddlers("[[2]pad[0]]").join(",")).toBe("2");
		expect(wiki.filterTiddlers("[[2]pad[1]]").join(",")).toBe("2");
		expect(wiki.filterTiddlers("2 20 +[pad[3]]").join(",")).toBe("002,020");
		expect(wiki.filterTiddlers("[[2]pad[9]]").join(",")).toBe("000000002");
		expect(wiki.filterTiddlers("[[2]pad[9],[a]]").join(",")).toBe("aaaaaaaa2");
		expect(wiki.filterTiddlers("[[12]pad[9],[abc]]").join(",")).toBe("abcabca12");
		expect(wiki.filterTiddlers("[[12]pad:suffix[9],[abc]]").join(",")).toBe("12abcabca");
		});
	
		it("should handle the escapecss operator", function() {
		expect(wiki.filterTiddlers("[[Hello There]escapecss[]]").join(",")).toBe("Hello\\ There");
		expect(wiki.filterTiddlers('\'"Reveal.js" by Devin Weaver[1]\' +[escapecss[]]').join(",")).toBe('\\"Reveal\\.js\\"\\ by\\ Devin\\ Weaver\\[1\\]');
		expect(wiki.filterTiddlers(".foo#bar (){} '--a' 0 \0 +[escapecss[]]").join(",")).toBe("\\.foo\\#bar,\\(\\)\\{\\},--a,\\30 ,\ufffd");
		expect(wiki.filterTiddlers("'' +[escapecss[]]").join(",")).toBe("");
		expect(wiki.filterTiddlers("1234 +[escapecss[]]").join(",")).toBe("\\31 234");
		expect(wiki.filterTiddlers("'-25' +[escapecss[]]").join(",")).toBe("-\\32 5");
		expect(wiki.filterTiddlers("'-' +[escapecss[]]").join(",")).toBe("\\-");
		});
		
		it("should handle the format operator", function() {
			expect(wiki.filterTiddlers("[[Hello There]] [[GettingStarted]] +[format:titlelist[]]").join(" ")).toBe("[[Hello There]] GettingStarted");
			expect(wiki.filterTiddlers("[title[Hello There]] +[format:titlelist[]]").join(" ")).toBe("[[Hello There]]");
			expect(wiki.filterTiddlers("[title[HelloThere]] +[format:titlelist[]]").join(" ")).toBe("HelloThere");		
			expect(wiki.filterTiddlers("0 +[format:timestamp[]]").join(",")).toBe("19700101000000000");
			expect(wiki.filterTiddlers("1603188514443 +[format:timestamp[]]").join(",")).toBe("20201020100834443");
			expect(wiki.filterTiddlers("void +[format:timestamp[]]").join(",")).toBe("");
		});
	
		it("should handle the deserializers operator", function() {
		var expectedDeserializers = ["application/javascript","application/json","application/x-tiddler","application/x-tiddler-html-div","application/x-tiddlers","text/css","text/html","text/plain"];
		if($tw.browser) {
			expectedDeserializers.unshift("(DOM)");
		}
		expect(wiki.filterTiddlers("[deserializers[]]").join(",")).toBe(expectedDeserializers.join(","));
		});
		
		it("should handle the charcode operator", function() {
			expect(wiki.filterTiddlers("[charcode[9]]").join(" ")).toBe(String.fromCharCode(9));
			expect(wiki.filterTiddlers("[charcode[9],[10]]").join(" ")).toBe(String.fromCharCode(9) + String.fromCharCode(10));
			expect(wiki.filterTiddlers("[charcode[]]").join(" ")).toBe("");
		});
		
		it("should handle the levenshtein operator", function() {
			expect(wiki.filterTiddlers("[[apple]levenshtein[apple]]").join(" ")).toBe("0");
			expect(wiki.filterTiddlers("[[apple]levenshtein[banana]]").join(" ")).toBe("9");
			expect(wiki.filterTiddlers("[[representation]levenshtein[misreprehensionisation]]").join(" ")).toBe("10");
			expect(wiki.filterTiddlers("[[the cat sat on the mat]levenshtein[the hat saw in every category]]").join(" ")).toBe("13");
		});
		
		it("should handle the makepatches operator", function() {
			expect(wiki.filterTiddlers("[[apple]makepatches[apple]]").join(" ")).toBe("");
			expect(wiki.filterTiddlers("[[apple]makepatches[banana]]").join(" ")).toBe("@@ -1,5 +1,6 @@\n-apple\n+banana\n");
			expect(wiki.filterTiddlers("[[representation]makepatches[misreprehensionisation]]").join(" ")).toBe("@@ -1,13 +1,21 @@\n+mis\n repre\n-sent\n+hensionis\n atio\n");
			expect(wiki.filterTiddlers("[[the cat sat on the mat]makepatches[the hat saw in every category]]").join(" ")).toBe("@@ -1,22 +1,29 @@\n the \n-c\n+h\n at sa\n-t on the mat\n+w in every category\n");
		});
	
		it("should parse filter variable parameters", function(){
		  expect($tw.utils.parseFilterVariable("currentTiddler")).toEqual(
			{ name: 'currentTiddler', params: [  ] }
		  );
		  expect($tw.utils.parseFilterVariable("now DDMM")).toEqual(
			{ name: 'now', params: [{ type: 'macro-parameter', start: 3, value: 'DDMM', end: 8 }] }
		  );
		  expect($tw.utils.parseFilterVariable("now DDMM UTC")).toEqual(
			{ name: 'now', params: [{ type: 'macro-parameter', start: 3, value: 'DDMM', end: 8 }, { type: 'macro-parameter', start: 8, value: 'UTC', end: 12 }] }
		  );
		  expect($tw.utils.parseFilterVariable("now format:DDMM")).toEqual(
			{ name: 'now', params: [{ type: 'macro-parameter', name:'format', start: 3, value: 'DDMM', end: 15 }] }	  	
		  );
		  expect($tw.utils.parseFilterVariable("now format:'DDMM'")).toEqual(
			{ name: 'now', params: [{ type: 'macro-parameter', name:'format', start: 3, value: 'DDMM', end: 17 }] }	  	
		  );
		  expect($tw.utils.parseFilterVariable("nowformat:'DDMM'")).toEqual(
			{ name: 'nowformat:\'DDMM\'', params: [] }
		  );
		  expect($tw.utils.parseFilterVariable("nowformat:'DD MM'")).toEqual(
			{ name: 'nowformat:', params: [{ type: 'macro-parameter', start: 10, value: 'DD MM', end: 17 }] }
		  );
		  expect($tw.utils.parseFilterVariable("now [UTC]YYYY0MM0DD0hh0mm0ssXXX")).toEqual(
			{ name: 'now', params: [{ type: 'macro-parameter', start: 3, value: '[UTC]YYYY0MM0DD0hh0mm0ssXXX', end: 31 }] }
		  );
		  expect($tw.utils.parseFilterVariable("now '[UTC]YYYY0MM0DD0hh0mm0ssXXX'")).toEqual(
			{ name: 'now', params: [{ type: 'macro-parameter', start: 3, value: '[UTC]YYYY0MM0DD0hh0mm0ssXXX', end: 33 }] }
		  );
		  expect($tw.utils.parseFilterVariable("now format:'[UTC]YYYY0MM0DD0hh0mm0ssXXX'")).toEqual(
			{ name: 'now', params: [{ type: 'macro-parameter', start: 3, name:'format', value: '[UTC]YYYY0MM0DD0hh0mm0ssXXX', end: 40 }] }
		  );
		  expect($tw.utils.parseFilterVariable("")).toEqual(
			{ name: '', params: [] }
		  );
		});
		
		it("should handle the encodeuricomponent and decodeuricomponent operators", function() {
			expect(wiki.filterTiddlers("[[<>:\"/\\|?*]encodeuricomponent[]]").join(",")).toBe("%3C%3E%3A%22%2F%5C%7C%3F%2A");
		});
	
		it("should handle the moduleproperty operator", function() {
			// We don't need to confirm them all, only it it finds at least one module name that we're sure is there.
			expect(wiki.filterTiddlers("[[macro]modules[]moduleproperty[name]]")).toContain("qualify");
			// No such property. Nothing to return.
			expect(wiki.filterTiddlers("[[macro]modules[]moduleproperty[nonexistent]]").length).toBe(0);
			// No such tiddlers. Nothing to return.
			expect(wiki.filterTiddlers("[[nonexistent]moduleproperty[name]]").length).toBe(0);
			// Non string properties should get toStringed.
			expect(wiki.filterTiddlers("[[$:/core/modules/commands/init.js]moduleproperty[info]]").join(" ")).toBe('{"name":"init","synchronous":true}');
		});

		it("should minimize unnecessary variable lookup", function() {
			var widget = wiki.makeWidget();
			var getVar = spyOn(widget, "getVariableInfo").and.callThrough();
			expect(wiki.filterTiddlers("[all[]prefix[anything]]", widget).length).toBe(0);
			// We didn't use any indirect operands or variables.
			// No variable lookup should have occurred.
			expect(getVar).not.toHaveBeenCalled();
		});
	}
	
	});
	
