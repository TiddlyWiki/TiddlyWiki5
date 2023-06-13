/*\
title: test-deserialize-operator.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests deserialize[] filter operator with various core deserializers

\*/
(function(){

	/* jslint node: true, browser: true */
	/* eslint-env node, browser, jasmine */
	/* eslint no-mixed-spaces-and-tabs: ["error", "smart-tabs"]*/
	/* global $tw, require */
	"use strict";

	
	describe("deserialize operator tests", function() {

		it("should support the deserialize[] operator", function() {
			//Unknown deserializer as operand
			expect($tw.wiki.filterTiddlers("[{dezerializer test data case 4}deserialize[unknown/deserializer]]")).toEqual([$tw.language.getString("Error/DeserializeOperator/UnknownDeserializer")]);

			//Missing operand
			expect($tw.wiki.filterTiddlers("[{dezerializer test data case 4}deserialize[]]")).toEqual([$tw.language.getString("Error/DeserializeOperator/MissingOperand")]);

			//Deserialize TiddlyWiki file
			expect($tw.wiki.filterTiddlers("[{dezerializer test data case 4}deserialize[text/html]]")).toEqual(['[{"type":"text/vnd.tiddlywiki","text":"Abacus","title":"Hello \\"There\\""},{"title":"Hello \\"There\\"","text":"Calculator"}]']);
			expect($tw.wiki.filterTiddlers("[{dezerializer test data case 5}deserialize[text/html]]")).toEqual(['[{"type":"text/vnd.tiddlywiki","text":"Abacus","title":"Hello \\"There\\""},{"title":"Hello \\"There\\"","text":"Calculator"},{"title":"Hello \\"There\\"","text":"Protractor"}]']);

			// Deserialize JSON payload containing tiddlers
			expect($tw.wiki.filterTiddlers("[{dezerializer test data case 6}deserialize[application/json]]")).toEqual( [ `[{"created":"20230601125557184","text":"Before you start storing important information in ~TiddlyWiki it is vital to make sure that you can reliably save changes. See https://tiddlywiki.com/#GettingStarted for details\\n\\n","title":"GettingStarted","modified":"20230601125601619"},{"created":"20230601125507054","text":"Welcome to \\"TiddlyWiki\\".\\n\\nThis is a test tiddler.","tags":"","title":"Hello There \\"Welcome\\"","modified":"20230601125551144"},{"title":"TiddlyWiki","created":"20130822170700000","modified":"20170127221451610","tags":"Concepts","type":"text/vnd.tiddlywiki","text":"~TiddlyWiki is a rich, interactive tool for manipulating complex data with structure that doesn't easily fit into conventional tools like spreadsheets or wordprocessors.\\n\\n~TiddlyWiki is designed to fit around your brain, helping you deal with the things that won't fit."}]` ]);
			expect($tw.wiki.filterTiddlers("[{dezerializer test data case 6}deserialize[application/json]jsonindexes[]] :map[{dezerializer test data case 6}jsonget<currentTiddler>,[title]]")).toEqual([ 'GettingStarted', 'Hello There "Welcome"', 'TiddlyWiki' ]);

			//Deserialize TiddlyWiki file with an mismatched deserializer
			expect($tw.wiki.filterTiddlers("[{dezerializer test data case 5}deserialize[application/json]]")).toEqual([jasmine.stringMatching('JSON error')]);
		});
	});
	
})();



 