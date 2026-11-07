/*\
title: test-bibtex-search.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests the BibTeX plugin's search results list. Reproduce in the browser console of a wiki with the plugin:
$tw.wiki.filterTiddlers($tw.wiki.getTiddler("$:/plugins/tiddlywiki/bibtex/ui/search-results").fields["first-search-filter"],$tw.rootWidget.makeFakeWidgetWithVariables({userInput: "Rune"}))

\*/
"use strict";

describe("BibTeX search results", function() {

	var LIST = "$:/plugins/tiddlywiki/bibtex/ui/search-results";

	function search(wiki,userInput) {
		var filter = $tw.wiki.getTiddler(LIST).fields["first-search-filter"];
		return wiki.filterTiddlers(filter,$tw.rootWidget.makeFakeWidgetWithVariables({userInput: userInput}));
	}

	function makeWiki() {
		var wiki = new $tw.Wiki();
		wiki.addTiddlers([
			{title: "Dalgaard2001", "bibtex-entry-type": "inproceedings", "bibtex-author": "Dalgaard, Rune"},
			{title: "Rare2002", "bibtex-entry-type": "book", "bibtex-keywords": "hypertext"},
			{title: "Plain tiddler", text: "Rune hypertext", "other-field": "Rune"},
			{
				title: "Stamped2003",
				"bibtex-entry-type": "book",
				created: new Date(Date.UTC(1999,5,15)),
				modified: new Date(Date.UTC(1998,5,15)),
				creator: "Zelda",
				modifier: "Yannick"
			}
		]);
		return wiki;
	}

	it("matches any bibtex field, including rare ones", function() {
		var wiki = makeWiki();
		expect(search(wiki,"Rune")).toEqual(["Dalgaard2001"]);
		expect(search(wiki,"hypertext")).toEqual(["Rare2002"]);
	});

	it("does not match the tiddler's own metadata", function() {
		var wiki = makeWiki();
		expect(search(wiki,"Zelda")).toEqual([]);
		expect(search(wiki,"Yannick")).toEqual([]);
		expect(search(wiki,"1999")).toEqual([]);
		expect(search(wiki,"1998")).toEqual([]);
	});

	it("shows the empty message when no entry matches", function() {
		var output = $tw.wiki.renderTiddler("text/plain",LIST,{variables: {userInput: "no such entry", configTiddler: LIST}});
		expect(output).toContain($tw.wiki.renderText("text/plain","text/vnd.tiddlywiki","{{$:/language/Search/Matches/NoResult}}"));
	});

	it("adds a tab beside the core list without replacing it", function() {
		var lists = $tw.wiki.filterTiddlers("[all[shadows+tiddlers]tag[$:/tags/SearchResults]!has[draft.of]]");
		expect(lists).toEqual(["$:/core/ui/DefaultSearchResultList",LIST]);
		expect($tw.wiki.getTiddlerText("$:/config/SearchResults/Default")).toBe("$:/core/ui/DefaultSearchResultList");
	});

});
